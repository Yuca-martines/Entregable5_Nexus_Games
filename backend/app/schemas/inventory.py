from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryMovementResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: Optional[str] = None
    tipo_movimiento: str
    cantidad: int
    stock_anterior: int
    stock_nuevo: int
    motivo: Optional[str] = None
    referencia: Optional[str] = None
    usuario_id: Optional[int] = None
    usuario_nombre: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True

class InventoryAdjustCreate(BaseModel):
    producto_id: int
    nuevo_stock: int = Field(..., ge=0)
    motivo: str = Field(..., min_length=3, max_length=255)
