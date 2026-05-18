from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Optional
from datetime import datetime
import os
import uuid

from ..database import get_db
from ..models import User, SupportTicket, SupportMessage
from ..api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/support", tags=["Support"])

# ==================== SCHEMAS ====================

class TicketCreate(BaseModel):
    subject: str
    message: str
    priority: Optional[str] = "normal"

class MessageCreate(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    message: str
    is_admin_reply: bool
    attachment_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class TicketDetailResponse(BaseModel):
    id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    messages: List[MessageResponse]
    
    class Config:
        from_attributes = True

# ==================== ENDPOINTS ====================

@router.post("/tickets", response_model=TicketResponse)
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создать обращение в поддержку
    """
    
    # Создаем тикет
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=data.subject,
        priority=data.priority
    )
    db.add(ticket)
    await db.flush()
    
    # Создаем первое сообщение
    message = SupportMessage(
        ticket_id=ticket.id,
        user_id=current_user.id,
        message=data.message,
        is_admin_reply=False
    )
    db.add(message)
    
    await db.commit()
    await db.refresh(ticket)
    
    return ticket

@router.get("/tickets", response_model=List[TicketResponse])
async def get_my_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить мои обращения
    """
    
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.user_id == current_user.id)
        .order_by(desc(SupportTicket.created_at))
    )
    tickets = result.scalars().all()
    
    return tickets

@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket_detail(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получить детали обращения
    """
    
    result = await db.execute(
        select(SupportTicket)
        .where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == current_user.id
            )
        )
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Получаем сообщения
    messages_result = await db.execute(
        select(SupportMessage)
        .where(SupportMessage.ticket_id == ticket_id)
        .order_by(SupportMessage.created_at)
    )
    messages = messages_result.scalars().all()
    
    return {
        **ticket.__dict__,
        "messages": messages
    }

@router.post("/tickets/{ticket_id}/messages", response_model=MessageResponse)
async def add_message(
    ticket_id: int,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Добавить сообщение в обращение
    """
    
    # Проверяем что тикет существует и принадлежит пользователю
    result = await db.execute(
        select(SupportTicket)
        .where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == current_user.id
            )
        )
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Создаем сообщение
    message = SupportMessage(
        ticket_id=ticket_id,
        user_id=current_user.id,
        message=data.message,
        is_admin_reply=False
    )
    db.add(message)
    
    # Обновляем статус тикета
    ticket.status = "in_progress"
    ticket.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(message)
    
    return message

@router.post("/tickets/{ticket_id}/upload")
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Загрузить скриншот/файл к обращению
    """
    
    # Проверяем тикет
    result = await db.execute(
        select(SupportTicket)
        .where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == current_user.id
            )
        )
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Проверяем тип файла
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only images allowed")
    
    # Сохраняем файл
    upload_dir = "uploads/support"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # TODO: Загрузить на Supabase Storage или S3
    # Пока просто локально
    
    file_url = f"/uploads/support/{file_name}"
    
    # Создаем сообщение с файлом
    message = SupportMessage(
        ticket_id=ticket_id,
        user_id=current_user.id,
        message="[Изображение]",
        is_admin_reply=False,
        attachment_url=file_url,
        attachment_type="image"
    )
    db.add(message)
    await db.commit()
    
    return {"url": file_url}

@router.patch("/tickets/{ticket_id}/close")
async def close_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Закрыть обращение
    """
    
    result = await db.execute(
        select(SupportTicket)
        .where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == current_user.id
            )
        )
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "closed"
    ticket.closed_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Ticket closed"}
