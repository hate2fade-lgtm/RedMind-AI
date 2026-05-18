from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class AnalysisTypeEnum(str, Enum):
    FREE = "free"
    SINGLE = "single"
    EXTENDED = "extended"
    PRO = "pro"

class AnalysisStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# Auth Schemas
class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    telegram_id: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    telegram_id: Optional[str] = None
    username: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_premium: bool
    premium_until: Optional[datetime] = None
    free_analyses_used: int
    total_analyses: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analysis Schemas
class AnalysisCreate(BaseModel):
    input_text: str = Field(..., min_length=50, max_length=50000)
    source_type: Optional[str] = Field(default="text", pattern="^(chat|profile|text)$")
    analysis_type: AnalysisTypeEnum = AnalysisTypeEnum.FREE
    
    @validator('input_text')
    def validate_text(cls, v):
        if len(v.strip()) < 50:
            raise ValueError('Текст слишком короткий для анализа (минимум 50 символов)')
        return v.strip()

class PersonalityAnalysis(BaseModel):
    archetype: str
    strengths: List[str]
    weaknesses: List[str]
    communication_style: str
    hidden_needs: Optional[List[str]] = None
    vulnerabilities: Optional[List[str]] = None

class AnalysisResult(BaseModel):
    toxicity_index: float = Field(..., ge=0, le=100)
    manipulation_detected: bool
    gaslighting_score: float = Field(..., ge=0, le=1)
    
    emotional_dependency_a: float = Field(..., ge=0, le=1)
    emotional_dependency_b: float = Field(..., ge=0, le=1)
    dominant_side: str = Field(..., pattern="^(A|B|Equal)$")
    
    attachment_style_a: str
    attachment_style_b: str
    
    red_flags: List[str]
    personality_analysis: PersonalityAnalysis
    recommendations: List[str]
    
    # Дополнительные поля для PRO
    return_probability: Optional[float] = None
    dependency_winner: Optional[str] = None
    breakup_initiator: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: int
    status: AnalysisStatusEnum
    analysis_type: AnalysisTypeEnum
    
    # Results
    toxicity_index: Optional[float] = None
    manipulation_detected: Optional[bool] = None
    gaslighting_score: Optional[float] = None
    
    emotional_dependency_a: Optional[float] = None
    emotional_dependency_b: Optional[float] = None
    dominant_side: Optional[str] = None
    
    attachment_style_a: Optional[str] = None
    attachment_style_b: Optional[str] = None
    
    red_flags: Optional[List[str]] = None
    personality_analysis: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[str]] = None
    
    # Metadata
    processing_time: Optional[float] = None
    report_url: Optional[str] = None
    
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AnalysisListResponse(BaseModel):
    total: int
    analyses: List[AnalysisResponse]

# Error Schemas
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None

# Stats Schemas
class UserStats(BaseModel):
    total_analyses: int
    free_analyses_remaining: int
    is_premium: bool
    avg_toxicity: Optional[float] = None
    most_common_red_flag: Optional[str] = None
