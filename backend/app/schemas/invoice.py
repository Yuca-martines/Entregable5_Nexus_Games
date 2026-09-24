from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class InvoiceDetailResponse(BaseModel):
    id: int
    tipo_item: str
    item_id: Optional[int] = None
    descripcion: str
    cantidad: int
    precio_unitario: float
    subtotal: float

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: int
    numero_factura: str
    venta_id: int
    cliente_id: int
    cliente_nombre: Optional[str] = None
    cliente_documento: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cliente_direccion: Optional[str] = None
    subtotal: float
    impuestos: float
    descuento: float
    total: float
    estado: str
    notas: Optional[str] = None
    fecha_emision: datetime
    detalles: List[InvoiceDetailResponse] = []

    class Config:
        from_attributes = True
