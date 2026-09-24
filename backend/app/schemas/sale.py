from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SaleItemCreate(BaseModel):
    tipo: str = Field(default="Producto", description="'Producto' o 'Servicio'")
    id: Optional[int] = Field(None, description="ID del producto o servicio si existe en catálogo")
    nombre: Optional[str] = Field(None, description="Nombre descriptivo del producto o servicio")
    cantidad: int = Field(default=1, ge=1)
    precio: Optional[float] = Field(None, ge=0)
    descuento: Optional[float] = Field(0.0, ge=0)

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    metodo_pago: Optional[str] = "Tarjeta de Crédito / PSE"
    descuento_general: Optional[float] = 0.0
    notas: Optional[str] = None
    cliente_id: Optional[int] = None # Opcional si lo registra un empleado para un cliente específico

class SaleDetailResponse(BaseModel):
    id: int
    tipo_item: str
    producto_id: Optional[int] = None
    servicio_id: Optional[int] = None
    nombre_item: str
    cantidad: int
    precio_unitario: float
    descuento: float
    subtotal: float

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    numero_venta: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_email: Optional[str] = None
    usuario_operacion_id: Optional[int] = None
    subtotal: float
    descuento: float
    impuestos: float
    total: float
    metodo_pago: str
    estado: str
    fecha_hora: datetime
    detalles: List[SaleDetailResponse] = []

    class Config:
        from_attributes = True
