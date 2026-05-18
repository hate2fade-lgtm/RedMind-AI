from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/redmind")
    
    # GigaChat
    GIGACHAT_API_KEY: str = os.getenv("GIGACHAT_API_KEY", "")
    GIGACHAT_AUTH_URL: str = os.getenv("GIGACHAT_AUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
    GIGACHAT_API_URL: str = os.getenv("GIGACHAT_API_URL", "https://gigachat.devices.sberbank.ru/api/v1")
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # App
    APP_NAME: str = "RedMind AI"
    DEBUG: bool = os.getenv("DEBUG", "True") == "True"
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Limits
    MAX_TEXT_LENGTH: int = 50000
    FREE_ANALYSES_LIMIT: int = 1
    
    # Subscription prices (в копейках для Stripe/ЮKassa)
    PRICE_SINGLE_ANALYSIS: int = 29900  # 299₽
    PRICE_EXTENDED_ANALYSIS: int = 59900  # 599₽
    PRICE_PRO_ANALYSIS: int = 99900  # 999₽
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
