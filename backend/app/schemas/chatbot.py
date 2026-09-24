from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str
    session_id: Optional[str] = "default_session"

class ChatMessageResponse(BaseModel):
    id: Optional[int] = None
    remitente: str
    contenido: str
    fecha_hora: Optional[datetime] = None
    sugerencias: Optional[List[str]] = []
