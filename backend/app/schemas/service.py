from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ServiceCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    descripcion: str = Field(..., min_length=5)
    precio: float = Field(..., ge=0)
    duracion_estimada: Optional[str] = Field(default="24 Horas")
    icono: Optional[str] = Field(default="Wrench")
    estado: Optional[str] = Field(default="Activo")

class ServiceUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    duracion_estimada: Optional[str] = None
    icono: Optional[str] = None
    estado: Optional[str] = None

class ServiceResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str
    precio: float
    duracion_estimada: Optional[str] = None
    icono: Optional[str] = None
    estado: str
    creado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
