from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ..database import get_db
from ..schemas import UserResponse, UserStats
from .. import crud
from ..api.auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user = Depends(get_current_active_user)
):
    """
    Получить профиль текущего пользователя
    """
    return current_user

@router.get("/me/stats", response_model=UserStats)
async def get_current_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Получить статистику текущего пользователя
    
    **Включает:**
    - Общее количество анализов
    - Оставшиеся бесплатные анализы
    - Статус Premium
    - Средний уровень токсичности
    """
    
    stats = await crud.get_user_stats(db, current_user.id)
    
    return stats

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Удалить свой аккаунт
    
    ⚠️ **ВНИМАНИЕ:** Это действие необратимо!
    
    Будет удалено:
    - Профиль пользователя
    - Все анализы
    - История платежей
    """
    
    # Удаляем пользователя (CASCADE удалит связанные данные)
    await db.delete(current_user)
    await db.commit()
    
    logger.warning(f"User deleted: id={current_user.id}, email={current_user.email}")
    
    return None
