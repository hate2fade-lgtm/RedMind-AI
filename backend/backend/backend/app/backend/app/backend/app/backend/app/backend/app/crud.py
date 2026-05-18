from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
from . import models, schemas
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== USER CRUD ====================

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[models.User]:
    """Получить пользователя по email"""
    result = await db.execute(
        select(models.User).where(models.User.email == email)
    )
    return result.scalar_one_or_none()

async def get_user_by_telegram_id(db: AsyncSession, telegram_id: str) -> Optional[models.User]:
    """Получить пользователя по Telegram ID"""
    result = await db.execute(
        select(models.User).where(models.User.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[models.User]:
    """Получить пользователя по ID"""
    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user: schemas.UserCreate) -> models.User:
    """Создать нового пользователя"""
    hashed_password = None
    if user.password:
        hashed_password = pwd_context.hash(user.password)
    
    db_user = models.User(
        email=user.email,
        telegram_id=user.telegram_id,
        username=user.username,
        hashed_password=hashed_password,
        is_verified=True if user.telegram_id else False,  # Telegram users auto-verified
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль"""
    return pwd_context.verify(plain_password, hashed_password)

async def update_user_login(db: AsyncSession, user_id: int):
    """Обновить время последнего входа"""
    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user:
        user.last_login = datetime.utcnow()
        await db.commit()

async def check_user_can_analyze(db: AsyncSession, user: models.User) -> tuple[bool, str]:
    """Проверить, может ли пользователь сделать анализ"""
    # Если премиум - всегда можно
    if user.is_premium and user.premium_until and user.premium_until > datetime.utcnow():
        return True, "ok"
    
    # Проверяем лимит бесплатных анализов
    from .config import settings
    if user.free_analyses_used >= settings.FREE_ANALYSES_LIMIT:
        return False, "free_limit_reached"
    
    return True, "ok"

async def increment_user_analyses(db: AsyncSession, user_id: int, is_free: bool = False):
    """Увеличить счетчики анализов"""
    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user:
        user.total_analyses += 1
        if is_free:
            user.free_analyses_used += 1
        await db.commit()

# ==================== ANALYSIS CRUD ====================

async def create_analysis(
    db: AsyncSession,
    user_id: int,
    analysis_data: schemas.AnalysisCreate
) -> models.Analysis:
    """Создать новый анализ"""
    db_analysis = models.Analysis(
        user_id=user_id,
        input_text=analysis_data.input_text,
        text_length=len(analysis_data.input_text),
        source_type=analysis_data.source_type,
        analysis_type=analysis_data.analysis_type,
        status=models.AnalysisStatus.PENDING,
    )
    
    db.add(db_analysis)
    await db.commit()
    await db.refresh(db_analysis)
    return db_analysis

async def update_analysis_status(
    db: AsyncSession,
    analysis_id: int,
    status: models.AnalysisStatus,
    error_message: Optional[str] = None
):
    """Обновить статус анализа"""
    result = await db.execute(
        select(models.Analysis).where(models.Analysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    if analysis:
        analysis.status = status
        if error_message:
            analysis.error_message = error_message
        if status == models.AnalysisStatus.COMPLETED:
            analysis.completed_at = datetime.utcnow()
        await db.commit()
        await db.refresh(analysis)
    return analysis

async def update_analysis_results(
    db: AsyncSession,
    analysis_id: int,
    results: dict,
    processing_time: float,
    tokens_used: Optional[int] = None
):
    """Сохранить результаты анализа"""
    result = await db.execute(
        select(models.Analysis).where(models.Analysis.id == analysis_id)
    )
    analysis = result.scalar_one_or_none()
    
    if analysis:
        # Основные метрики
        analysis.toxicity_index = results.get("toxicity_index")
        analysis.manipulation_detected = results.get("manipulation_detected")
        analysis.gaslighting_score = results.get("gaslighting_score")
        
        analysis.emotional_dependency_a = results.get("emotional_dependency_a")
        analysis.emotional_dependency_b = results.get("emotional_dependency_b")
        analysis.dominant_side = results.get("dominant_side")
        
        analysis.attachment_style_a = results.get("attachment_style_a")
        analysis.attachment_style_b = results.get("attachment_style_b")
        
        analysis.red_flags = results.get("red_flags", [])
        analysis.personality_analysis = results.get("personality_analysis", {})
        analysis.recommendations = results.get("recommendations", [])
        
        # Полный ответ
        analysis.full_response = results
        
        # Метаданные
        analysis.processing_time = processing_time
        analysis.tokens_used = tokens_used
        analysis.status = models.AnalysisStatus.COMPLETED
        analysis.completed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(analysis)
    
    return analysis

async def get_analysis_by_id(
    db: AsyncSession,
    analysis_id: int,
    user_id: Optional[int] = None
) -> Optional[models.Analysis]:
    """Получить анализ по ID"""
    query = select(models.Analysis).where(models.Analysis.id == analysis_id)
    
    if user_id:
        query = query.where(models.Analysis.user_id == user_id)
    
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_user_analyses(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20
) -> tuple[List[models.Analysis], int]:
    """Получить список анализов пользователя"""
    # Общее количество
    count_result = await db.execute(
        select(func.count(models.Analysis.id)).where(models.Analysis.user_id == user_id)
    )
    total = count_result.scalar()
    
    # Список с пагинацией
    result = await db.execute(
        select(models.Analysis)
        .where(models.Analysis.user_id == user_id)
        .order_by(desc(models.Analysis.created_at))
        .offset(skip)
        .limit(limit)
    )
    analyses = result.scalars().all()
    
    return list(analyses), total

async def get_user_stats(db: AsyncSession, user_id: int) -> dict:
    """Получить статистику пользователя"""
    result = await db.execute(
        select(models.User).where(models.User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return {}
    
    # Средний уровень токсичности
    avg_result = await db.execute(
        select(func.avg(models.Analysis.toxicity_index))
        .where(
            and_(
                models.Analysis.user_id == user_id,
                models.Analysis.status == models.AnalysisStatus.COMPLETED
            )
        )
    )
    avg_toxicity = avg_result.scalar()
    
    from .config import settings
    
    return {
        "total_analyses": user.total_analyses,
        "free_analyses_remaining": max(0, settings.FREE_ANALYSES_LIMIT - user.free_analyses_used),
        "is_premium": user.is_premium and (user.premium_until > datetime.utcnow() if user.premium_until else False),
        "avg_toxicity": round(avg_toxicity, 2) if avg_toxicity else None,
    }

# ==================== PAYMENT CRUD ====================

async def create_payment(
    db: AsyncSession,
    user_id: int,
    amount: int,
    payment_type: models.AnalysisType,
    provider: str = "yookassa"
) -> models.Payment:
    """Создать запись о платеже"""
    db_payment = models.Payment(
        user_id=user_id,
        amount=amount,
        payment_type=payment_type,
        payment_provider=provider,
        status="pending"
    )
    
    db.add(db_payment)
    await db.commit()
    await db.refresh(db_payment)
    return db_payment

async def complete_payment(db: AsyncSession, payment_id: int, provider_payment_id: str):
    """Завершить платеж"""
    result = await db.execute(
        select(models.Payment).where(models.Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if payment:
        payment.status = "completed"
        payment.provider_payment_id = provider_payment_id
        payment.completed_at = datetime.utcnow()
        await db.commit()
        await db.refresh(payment)
    
    return payment

# ==================== API KEY CRUD ====================

async def create_api_key(db: AsyncSession, user_id: int, name: Optional[str] = None) -> models.ApiKey:
    """Создать API ключ"""
    key = secrets.token_urlsafe(48)
    
    db_key = models.ApiKey(
        user_id=user_id,
        key=key,
        name=name or f"API Key {datetime.utcnow().strftime('%Y-%m-%d')}"
    )
    
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)
    return db_key

async def get_api_key(db: AsyncSession, key: str) -> Optional[models.ApiKey]:
    """Получить API ключ"""
    result = await db.execute(
        select(models.ApiKey).where(
            and_(
                models.ApiKey.key == key,
                models.ApiKey.is_active == True
            )
        )
    )
    return result.scalar_one_or_none()

async def increment_api_key_usage(db: AsyncSession, key_id: int):
    """Увеличить счетчик использования API ключа"""
    result = await db.execute(
        select(models.ApiKey).where(models.ApiKey.id == key_id)
    )
    api_key = result.scalar_one_or_none()
    
    if api_key:
        api_key.requests_count += 1
        api_key.last_used = datetime.utcnow()
        await db.commit()
