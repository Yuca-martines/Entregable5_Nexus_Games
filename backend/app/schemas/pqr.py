from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class PQRCreate(BaseModel):
    cliente_nombre: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefono: Optional[str] = None
    tipo: str = Field(..., description="Petición, Queja, Reclamo o Sugerencia")
    asunto: str = Field(..., min_length=4, max_length=200)
    descripcion: str = Field(..., min_length=10)

class PQRResponseUpdate(BaseModel):
    estado: str = Field(..., description="'Pendiente', 'En Proceso', 'Respondida', 'Cerrada'")
    respuesta: str = Field(..., min_length=5)

class PQRResponse(BaseModel):
    id: int
    radicado: str
    usuario_id: Optional[int] = None
    cliente_nombre: str
    cliente_email: str
    cliente_telefono: Optional[str] = None
    tipo: str
    asunto: str
    descripcion: str
    estado: str
    respuesta: Optional[str] = None
    usuario_atencion_id: Optional[int] = None
    fecha_radicacion: datetime
    fecha_respuesta: Optional[datetime] = None

    class Config:
        from_attributes = True
