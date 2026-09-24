from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class Purchase(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    numero_compra = Column(String(50), unique=True, index=True, nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False) # Usuario que registra la compra
    subtotal = Column(Float, nullable=False, default=0.0)
    impuestos = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    metodo_pago = Column(String(50), default="Transferencia Bancaria")
    estado = Column(String(30), default="Completada") # Completada, Anulada
    notas = Column(Text, nullable=True)
    fecha_hora = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    proveedor = relationship("Supplier", back_populates="compras")
    usuario = relationship("User", foreign_keys=[usuario_id])
    detalles = relationship("PurchaseDetail", back_populates="compra", cascade="all, delete-orphan")

class PurchaseDetail(Base):
    __tablename__ = "detalle_compras"

    id = Column(Integer, primary_key=True, index=True)
    compra_id = Column(Integer, ForeignKey("compras.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_costo_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    # Relaciones
    compra = relationship("Purchase", back_populates="detalles")
    producto = relationship("Product")
