from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
import time

from ..database import get_db
from ..schemas import (
    AnalysisCreate,
    AnalysisResponse,
    AnalysisListResponse,
    ErrorResponse
)
from ..models import AnalysisStatus, AnalysisType
from .. import crud
from ..services.gigachat_service import gigachat_service
from ..services.text_processor import text_processor
from ..api.auth import get_current_active_user
from ..utils.helpers import rate_limiter, create_error_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

# ==================== BACKGROUND TASKS ====================

async def process_analysis_task(analysis_id: int, db: AsyncSession):
    """
    Фоновая задача для обработки анализа
    
    Args:
        analysis_id: ID анализа
        db: Database session
    """
    
    logger.info(f"Starting background analysis task: analysis_id={analysis_id}")
    
    try:
        # Получаем анализ
        analysis = await crud.get_analysis_by_id(db, analysis_id)
        
        if not analysis:
            logger.error(f"Analysis not found: {analysis_id}")
            return
        
        # Обновляем статус на PROCESSING
        await crud.update_analysis_status(db, analysis_id, AnalysisStatus.PROCESSING)
        
        # Очищаем текст
        cleaned_text = text_processor.clean_text(analysis.input_text)
        
        # Валидация
        is_valid, error_msg = text_processor.validate_text(cleaned_text)
        if not is_valid:
            logger.error(f"Text validation failed: {error_msg}")
            await crud.update_analysis_status(
                db,
                analysis_id,
                AnalysisStatus.FAILED,
                error_msg
            )
            return
        
        # Замеряем время
        start_time = time.time()
        
        # Отправляем в GigaChat
        logger.info(f"Sending to GigaChat: analysis_id={analysis_id}, type={analysis.analysis_type}")
        
        result = await gigachat_service.analyze_conversation(
            text=cleaned_text,
            analysis_type=analysis.analysis_type.value
        )
        
        processing_time = time.time() - start_time
        
        # Извлекаем метаданные
        tokens_used = result.get("_metadata", {}).get("tokens_used", 0)
        
        # Удаляем служебные поля перед сохранением
        result.pop("_metadata", None)
        result.pop("_error", None)
        result.pop("_raw_response", None)
        
        # Сохраняем результаты
        await crud.update_analysis_results(
            db,
            analysis_id,
            result,
            processing_time,
            tokens_used
        )
        
        logger.info(f"Analysis completed successfully: analysis_id={analysis_id}, time={processing_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Error processing analysis {analysis_id}: {str(e)}", exc_info=True)
        
        # Обновляем статус на FAILED
        await crud.update_analysis_status(
            db,
            analysis_id,
            AnalysisStatus.FAILED,
            str(e)
        )

# ==================== ENDPOINTS ====================

@router.post("/", response_model=AnalysisResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_analysis(
    data: AnalysisCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Создать новый анализ переписки
    
    **Процесс:**
    1. Валидация входных данных
    2. Проверка лимитов пользователя
    3. Создание записи в БД
    4. Запуск фонового анализа через AI
    5. Возврат ID анализа
    
    **Лимиты:**
    - Бесплатные пользователи: 1 анализ
    - Premium: безлимит
    
    **Типы анализа:**
    - `free`: базовый анализ
    - `single`: 299₽
    - `extended`: 599₽
    - `pro`: 999₽ (макс. детализация)
    """
    
    logger.info(f"Analysis request: user_id={current_user.id}, type={data.analysis_type}")
    
    # Rate limiting
    if not rate_limiter.is_allowed(f"user_{current_user.id}_analyze", max_requests=5, window_seconds=60):
        create_error_response(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Слишком много запросов. Подождите минуту.",
            "RATE_LIMIT"
        )
    
    # Проверяем лимиты пользователя
    can_analyze, reason = await crud.check_user_can_analyze(db, current_user)
    
    if not can_analyze:
        if reason == "free_limit_reached":
            create_error_response(
                status.HTTP_403_FORBIDDEN,
                "Бесплатный лимит исчерпан. Оформите подписку или купите анализ.",
                "FREE_LIMIT_REACHED"
            )
        else:
            create_error_response(
                status.HTTP_403_FORBIDDEN,
                "Невозможно создать анализ",
                "ANALYSIS_FORBIDDEN"
            )
    
    # Валидация текста
    is_valid, error_msg = text_processor.validate_text(data.input_text)
    if not is_valid:
        create_error_response(
            status.HTTP_400_BAD_REQUEST,
            error_msg,
            "INVALID_TEXT"
        )
    
    # Создаем запись анализа
    try:
        analysis = await crud.create_analysis(db, current_user.id, data)
        
        # Увеличиваем счетчики
        is_free = data.analysis_type == AnalysisType.FREE
        await crud.increment_user_analyses(db, current_user.id, is_free)
        
        # Запускаем фоновую обработку
        background_tasks.add_task(process_analysis_task, analysis.id, db)
        
        logger.info(f"Analysis created: id={analysis.id}, user_id={current_user.id}")
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}", exc_info=True)
        create_error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Ошибка при создании анализа",
            "CREATION_ERROR"
        )

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Получить результаты анализа по ID
    
    **Статусы:**
    - `pending`: в очереди
    - `processing`: обрабатывается AI
    - `completed`: готово
    - `failed`: ошибка
    """
    
    analysis = await crud.get_analysis_by_id(db, analysis_id, current_user.id)
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Анализ не найден"
        )
    
    return analysis

@router.get("/", response_model=AnalysisListResponse)
async def get_user_analyses(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Получить список анализов текущего пользователя
    
    **Параметры:**
    - `skip`: пропустить N записей (пагинация)
    - `limit`: максимум записей (макс. 100)
    """
    
    if limit > 100:
        limit = 100
    
    analyses, total = await crud.get_user_analyses(db, current_user.id, skip, limit)
    
    return {
        "total": total,
        "analyses": analyses
    }

@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Удалить анализ
    
    ⚠️ Безвозвратное удаление!
    """
    
    analysis = await crud.get_analysis_by_id(db, analysis_id, current_user.id)
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Анализ не найден"
        )
    
    # Удаляем (нужно добавить в crud.py)
    await db.delete(analysis)
    await db.commit()
    
    logger.info(f"Analysis deleted: id={analysis_id}, user_id={current_user.id}")
    
    return None
