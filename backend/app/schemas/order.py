from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class OrderItemCreate(BaseModel):
    id: int = Field(..., description="ID del producto")
    quantity: int = Field(default=1, ge=1)
    precio: Optional[float] = None
    price: Optional[float] = None

class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    total: float = Field(..., ge=0)
    metodo_pago: Optional[str] = "Tarjeta de Crédito / PSE"
    direccion_envio: Optional[str] = None
    estado: Optional[str] = Field(default="Pendiente", description="Estado inicial del pedido")
    motivo_cancelacion: Optional[str] = None
    notas: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    estado: str = Field(..., pattern="^(Pendiente|En proceso|Completada|Cancelada)$")
    motivo_cancelacion: Optional[str] = None
    notas: Optional[str] = None

class OrderDetailResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: Optional[str] = None
    producto_imagen: Optional[str] = None
    cantidad: int
    precio_unitario: float
    subtotal: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    usuario_id: int
    cliente_nombre: Optional[str] = None
    cliente_apellido: Optional[str] = None
    cliente_email: Optional[str] = None
    total: float
    metodo_pago: str
    estado: str
    direccion_envio: Optional[str] = None
    creado_en: Optional[datetime] = None
    items: Optional[List[OrderDetailResponse]] = []

    class Config:
        from_attributes = True
