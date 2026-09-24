from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SupplierCreate(BaseModel):
    nit_rut: str = Field(..., min_length=5, max_length=50)
    razon_social: str = Field(..., min_length=2, max_length=150)
    contacto_nombre: Optional[str] = None
    telefono: str = Field(..., min_length=7, max_length=30)
    email: str = Field(..., max_length=150)
    direccion: Optional[str] = None
    ciudad: Optional[str] = "Bogotá"
    estado: Optional[str] = "Activo"

class SupplierUpdate(BaseModel):
    nit_rut: Optional[str] = None
    razon_social: Optional[str] = None
    contacto_nombre: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None

class SupplierResponse(BaseModel):
    id: int
    nit_rut: str
    razon_social: str
    contacto_nombre: Optional[str] = None
    telefono: str
    email: str
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    estado: str
    creado_en: Optional[datetime] = None

    class Config:
        from_attributes = True

class PurchaseItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(..., gt=0)
    precio_costo_unitario: float = Field(..., ge=0)

class PurchaseCreate(BaseModel):
    proveedor_id: int
    items: List[PurchaseItemCreate]
    metodo_pago: Optional[str] = "Transferencia Bancaria"
    notas: Optional[str] = None

class PurchaseDetailResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: Optional[str] = None
    cantidad: int
    precio_costo_unitario: float
    subtotal: float

class PurchaseResponse(BaseModel):
    id: int
    numero_compra: str
    proveedor_id: int
    proveedor_nombre: Optional[str] = None
    usuario_id: int
    usuario_nombre: Optional[str] = None
    subtotal: float
    impuestos: float
    total: float
    metodo_pago: str
    estado: str
    notas: Optional[str] = None
    fecha_hora: datetime
    detalles: List[PurchaseDetailResponse] = []

    class Config:
        from_attributes = True
