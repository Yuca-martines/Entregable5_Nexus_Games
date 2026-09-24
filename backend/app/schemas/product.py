from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CategoryResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150)
    descripcion: str = Field(..., min_length=5)
    precio: float = Field(..., ge=0)
    stock: int = Field(..., ge=0)
    categoria_id: int = Field(..., gt=0)
    plataforma: Optional[str] = Field(default="Multiplataforma")
    imagen: Optional[str] = Field(default="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop")
    destacado: Optional[int] = Field(default=0)
    estado: Optional[str] = Field(default="Activo")

class ProductUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    categoria_id: Optional[int] = None
    plataforma: Optional[str] = None
    imagen: Optional[str] = None
    destacado: Optional[int] = None
    estado: Optional[str] = None

class ProductStockUpdate(BaseModel):
    stock: Optional[int] = None
    delta: Optional[int] = None

class ProductResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str
    precio: float
    stock: int
    categoria_id: int
    categoria_nombre: Optional[str] = None
    plataforma: Optional[str] = "Multiplataforma"
    imagen: str
    destacado: int
    estado: str
    creado_en: Optional[datetime] = None

    class Config:
        from_attributes = True
