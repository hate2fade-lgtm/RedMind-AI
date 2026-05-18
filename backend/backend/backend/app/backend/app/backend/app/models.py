from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
from datetime import datetime

# Enums
class AnalysisType(str, enum.Enum):
    FREE = "free"
    SINGLE = "single"
    EXTENDED = "extended"
    PRO = "pro"

class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    telegram_id = Column(String(100), unique=True, index=True, nullable=True)
    username = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=True)
    
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Subscription
    is_premium = Column(Boolean, default=False)
    premium_until = Column(DateTime, nullable=True)
    
    # Counters
    free_analyses_used = Column(Integer, default=0)
    total_analyses = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email or self.telegram_id}>"

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Analysis info
    analysis_type = Column(SQLEnum(AnalysisType), default=AnalysisType.FREE)
    status = Column(SQLEnum(AnalysisStatus), default=AnalysisStatus.PENDING)
    
    # Input data
    input_text = Column(Text, nullable=False)
    text_length = Column(Integer, nullable=False)
    source_type = Column(String(50), nullable=True)  # "chat", "profile", "text"
    
    # Results (JSON)
    toxicity_index = Column(Float, nullable=True)
    manipulation_detected = Column(Boolean, nullable=True)
    gaslighting_score = Column(Float, nullable=True)
    
    emotional_dependency_a = Column(Float, nullable=True)
    emotional_dependency_b = Column(Float, nullable=True)
    dominant_side = Column(String(10), nullable=True)  # "A" or "B"
    
    attachment_style_a = Column(String(50), nullable=True)
    attachment_style_b = Column(String(50), nullable=True)
    
    red_flags = Column(JSON, nullable=True)  # список строк
    personality_analysis = Column(JSON, nullable=True)  # полный объект
    recommendations = Column(JSON, nullable=True)  # список строк
    
    # Full response
    full_response = Column(JSON, nullable=True)
    
    # Metadata
    processing_time = Column(Float, nullable=True)  # seconds
    tokens_used = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # PDF report
    report_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="analyses")
    
    def __repr__(self):
        return f"<Analysis {self.id} - {self.status}>"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Payment info
    amount = Column(Integer, nullable=False)  # в копейках
    currency = Column(String(3), default="RUB")
    
    payment_type = Column(SQLEnum(AnalysisType), nullable=False)
    payment_provider = Column(String(50), nullable=True)  # "stripe", "yookassa"
    provider_payment_id = Column(String(255), nullable=True)
    
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.amount/100}₽>"

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    key = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    # Usage
    requests_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<ApiKey {self.key[:8]}...>"
        # В конец файла, после класса ApiKey

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    subject = Column(String(200), nullable=False)
    status = Column(String(50), default="open")  # open, in_progress, closed
    priority = Column(String(50), default="normal")  # low, normal, high, urgent
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SupportTicket {self.id} - {self.status}>"

class SupportMessage(Base):
    __tablename__ = "support_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    message = Column(Text, nullable=False)
    is_admin_reply = Column(Boolean, default=False)
    
    # Attachments
    attachment_url = Column(String(500), nullable=True)
    attachment_type = Column(String(50), nullable=True)  # image, file
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ticket = relationship("SupportTicket", back_populates="messages")
    
    def __repr__(self):
        return f"<SupportMessage {self.id}>"
