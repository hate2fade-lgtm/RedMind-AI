from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
import re
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== PASSWORD ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Хешировать пароль"""
    return pwd_context.hash(password)

def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Проверить надежность пароля
    
    Returns:
        (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Пароль должен содержать минимум 8 символов"
    
    if not re.search(r"[a-z]", password):
        return False, "Пароль должен содержать строчные буквы"
    
    if not re.search(r"[A-Z]", password):
        return False, "Пароль должен содержать заглавные буквы"
    
    if not re.search(r"\d", password):
        return False, "Пароль должен содержать цифры"
    
    return True, None

# ==================== JWT ====================

def create_access_token(data: dict, secret_key: str, algorithm: str, expires_delta: Optional[timedelta] = None) -> str:
    """Создать JWT токен"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    
    return encoded_jwt

def decode_access_token(token: str, secret_key: str, algorithm: str) -> Optional[dict]:
    """Декодировать JWT токен"""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        return None

# ==================== VALIDATION ====================

def validate_email(email: str) -> bool:
    """Валидация email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_telegram_id(telegram_id: str) -> bool:
    """Валидация Telegram ID"""
    # Telegram ID - это числа
    return telegram_id.isdigit() and len(telegram_id) <= 15

# ==================== FORMATTERS ====================

def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Форматировать datetime в строку"""
    if dt is None:
        return None
    return dt.isoformat()

def truncate_text(text: str, max_length: int = 100) -> str:
    """Обрезать текст"""
    if len(text) <= max_length:
        return text
    return text[:max_length] + "..."

# ==================== ERROR HANDLERS ====================

def create_error_response(status_code: int, message: str, error_code: Optional[str] = None):
    """Создать ошибку HTTP"""
    detail = {"message": message}
    if error_code:
        detail["error_code"] = error_code
    
    raise HTTPException(status_code=status_code, detail=detail)

# ==================== SANITIZATION ====================

def sanitize_input(text: str) -> str:
    """Очистить пользовательский ввод"""
    # Убираем HTML теги
    text = re.sub(r'<[^>]+>', '', text)
    # Убираем лишние пробелы
    text = ' '.join(text.split())
    return text.strip()

# ==================== RATE LIMITING ====================

class RateLimiter:
    """Простой rate limiter в памяти"""
    
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        """
        Проверить разрешен ли запрос
        
        Args:
            key: Уникальный ключ (user_id, ip и т.д.)
            max_requests: Максимум запросов
            window_seconds: Окно в секундах
        """
        now = datetime.utcnow()
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Удаляем старые запросы
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if (now - req_time).total_seconds() < window_seconds
        ]
        
        # Проверяем лимит
        if len(self.requests[key]) >= max_requests:
            return False
        
        # Добавляем новый запрос
        self.requests[key].append(now)
        return True

rate_limiter = RateLimiter()
