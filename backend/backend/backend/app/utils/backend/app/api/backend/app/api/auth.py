from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Optional
import logging

from ..database import get_db
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from ..config import settings
from .. import crud
from ..utils.helpers import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    validate_password_strength,
    create_error_response
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ==================== HELPER FUNCTIONS ====================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Получить текущего пользователя из JWT токена"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token, settings.SECRET_KEY, settings.ALGORITHM)
    
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = await crud.get_user_by_id(db, user_id=int(user_id))
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """Получить активного пользователя"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# ==================== ENDPOINTS ====================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Регистрация нового пользователя
    
    - **email**: Email пользователя (опционально для Telegram users)
    - **password**: Пароль (опционально для Telegram users)
    - **telegram_id**: Telegram ID (опционально для web users)
    """
    
    logger.info(f"Registration attempt: email={user_data.email}, telegram_id={user_data.telegram_id}")
    
    # Валидация: нужен либо email+password, либо telegram_id
    if not user_data.email and not user_data.telegram_id:
        create_error_response(
            status.HTTP_400_BAD_REQUEST,
            "Укажите email или Telegram ID",
            "MISSING_CREDENTIALS"
        )
    
    # Email регистрация
    if user_data.email:
        # Проверяем существование
        existing_user = await crud.get_user_by_email(db, user_data.email)
        if existing_user:
            create_error_response(
                status.HTTP_400_BAD_REQUEST,
                "Email уже зарегистрирован",
                "EMAIL_EXISTS"
            )
        
        # Проверяем пароль
        if not user_data.password:
            create_error_response(
                status.HTTP_400_BAD_REQUEST,
                "Укажите пароль",
                "PASSWORD_REQUIRED"
            )
        
        # Валидация пароля
        is_valid, error = validate_password_strength(user_data.password)
        if not is_valid:
            create_error_response(
                status.HTTP_400_BAD_REQUEST,
                error,
                "WEAK_PASSWORD"
            )
    
    # Telegram регистрация
    if user_data.telegram_id:
        existing_user = await crud.get_user_by_telegram_id(db, user_data.telegram_id)
        if existing_user:
            create_error_response(
                status.HTTP_400_BAD_REQUEST,
                "Telegram аккаунт уже зарегистрирован",
                "TELEGRAM_EXISTS"
            )
    
    # Создаем пользователя
    try:
        user = await crud.create_user(db, user_data)
        logger.info(f"User created successfully: id={user.id}")
        return user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        create_error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Ошибка при создании пользователя",
            "CREATION_ERROR"
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Вход в систему
    
    - **username**: Email пользователя
    - **password**: Пароль
    """
    
    logger.info(f"Login attempt: email={form_data.username}")
    
    # Получаем пользователя
    user = await crud.get_user_by_email(db, form_data.username)
    
    if not user:
        logger.warning(f"Login failed: user not found - {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем пароль
    if not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Login failed: invalid password - {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверяем активность
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован"
        )
    
    # Создаем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        expires_delta=access_token_expires
    )
    
    # Обновляем время входа
    await crud.update_user_login(db, user.id)
    
    logger.info(f"Login successful: user_id={user.id}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/telegram-login", response_model=Token)
async def telegram_login(
    telegram_id: str,
    username: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Вход через Telegram
    
    - **telegram_id**: Telegram user ID
    - **username**: Telegram username (опционально)
    """
    
    logger.info(f"Telegram login attempt: telegram_id={telegram_id}")
    
    # Ищем пользователя
    user = await crud.get_user_by_telegram_id(db, telegram_id)
    
    # Если нет - создаем
    if not user:
        logger.info(f"Creating new Telegram user: telegram_id={telegram_id}")
        user_data = UserCreate(
            telegram_id=telegram_id,
            username=username
        )
        user = await crud.create_user(db, user_data)
    
    # Создаем токен
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        expires_delta=access_token_expires
    )
    
    # Обновляем время входа
    await crud.update_user_login(db, user.id)
    
    logger.info(f"Telegram login successful: user_id={user.id}")
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_active_user)):
    """
    Получить информацию о текущем пользователе
    """
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user = Depends(get_current_active_user)
):
    """
    Обновить access token
    """
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(current_user.id)},
        secret_key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
