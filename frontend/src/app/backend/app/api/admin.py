from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Analysis, Payment, UserRole
from ..schemas import UserResponse
from ..api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

# ==================== SCHEMAS ====================

class AdminStats(BaseModel):
    total_users: int
    total_analyses: int
    premium_users: int
    total_revenue: float
    analyses_today: int
    new_users_today: int

class UserUpdate(BaseModel):
    is_premium: Optional[bool] = None
    premium_days: Optional[int] = None
    free_analyses_reset: Optional[bool] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class UserListResponse(BaseModel):
    total: int
    users: List[UserResponse]

# ==================== MIDDLEWARE ====================

async def get_admin_user(current_user: User = Depends(get_current_user)):
    """Проверка что пользователь - админ"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# ==================== ENDPOINTS ====================

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Получить статистику для админ-панели
    """
    
    # Общее количество пользователей
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    
    # Общее количество анализов
    total_analyses_result = await db.execute(select(func.count(Analysis.id)))
    total_analyses = total_analyses_result.scalar()
    
    # Количество премиум пользователей
    premium_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_premium == True)
    )
    premium_users = premium_users_result.scalar()
    
    # Общая выручка (в рублях)
    total_revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == "completed")
    )
    total_revenue_kopeks = total_revenue_result.scalar() or 0
    total_revenue = total_revenue_kopeks / 100
    
    # Анализов сегодня
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    analyses_today_result = await db.execute(
        select(func.count(Analysis.id)).where(Analysis.created_at >= today)
    )
    analyses_today = analyses_today_result.scalar()
    
    # Новых пользователей сегодня
    new_users_today_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today)
    )
    new_users_today = new_users_today_result.scalar()
    
    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "premium_users": premium_users,
        "total_revenue": total_revenue,
        "analyses_today": analyses_today,
        "new_users_today": new_users_today,
    }

@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Получить список всех пользователей
    """
    
    query = select(User)
    
    # Поиск по email или username
    if search:
        query = query.where(
            (User.email.ilike(f"%{search}%")) | 
            (User.username.ilike(f"%{search}%"))
        )
    
    # Подсчет
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    # Список с пагинацией
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "total": total,
        "users": users
    }

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Получить детали пользователя
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Обновить данные пользователя
    
    - Выдать Premium
    - Сбросить бесплатные анализы
    - Заблокировать/разблокировать
    - Назначить админом
    """
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Обновляем поля
    if data.is_premium is not None:
        user.is_premium = data.is_premium
        if data.is_premium and data.premium_days:
            user.premium_until = datetime.utcnow() + timedelta(days=data.premium_days)
    
    if data.free_analyses_reset:
        user.free_analyses_used = 0
    
    if data.is_active is not None:
        user.is_active = data.is_active
    
    if data.role is not None:
        user.role = data.role
    
    await db.commit()
    await db.refresh(user)
    
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Удалить пользователя
    """
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    await db.delete(user)
    await db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/make-admin/{user_id}")
async def make_user_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Сделать пользователя админом
    """
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = UserRole.ADMIN
    await db.commit()
    
    return {"message": f"User {user.email} is now an admin"}

@router.post("/grant-premium/{user_id}")
async def grant_premium(
    user_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Выдать Premium подписку пользователю
    """
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_premium = True
    user.premium_until = datetime.utcnow() + timedelta(days=days)
    
    await db.commit()
    
    return {
        "message": f"Premium granted to {user.email} for {days} days",
        "premium_until": user.premium_until
    }
