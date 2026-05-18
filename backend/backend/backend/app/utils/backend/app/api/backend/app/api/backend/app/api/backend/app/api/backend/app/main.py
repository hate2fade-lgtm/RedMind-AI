from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import time

from .config import settings
from .database import init_db, close_db
from .api import auth, analyze, users

# Настройка логирования
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle менеджер приложения
    """
    # Startup
    logger.info("🚀 Starting RedMind AI backend...")
    
    try:
        await init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down RedMind AI backend...")
    await close_db()
    logger.info("✅ Database connections closed")

# ==================== APP ====================

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered relationship analysis service",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# ==================== MIDDLEWARE ====================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Добавить время обработки запроса в заголовки"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Логировать все запросы"""
    logger.info(f"📨 {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"📤 {request.method} {request.url.path} - {response.status_code}")
    return response

# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Обработка ошибок валидации"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Ошибка валидации данных",
            "errors": errors
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Глобальный обработчик ошибок"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Внутренняя ошибка сервера",
            "error": str(exc) if settings.DEBUG else "Internal server error"
        }
    )

# ==================== ROUTERS ====================

app.include_router(auth.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(users.router, prefix="/api")

# ==================== ROOT ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs" if settings.DEBUG else "disabled"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_service": "gigachat",
        "timestamp": time.time()
    }

# ==================== STARTUP MESSAGE ====================

@app.on_event("startup")
async def startup_message():
    """Вывести информацию при запуске"""
    logger.info("=" * 60)
    logger.info(f"🔥 {settings.APP_NAME} v1.0.0")
    logger.info(f"🌍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"📚 Docs: http://localhost:8000/api/docs")
    logger.info(f"🤖 AI: GigaChat")
    logger.info("=" * 60)
