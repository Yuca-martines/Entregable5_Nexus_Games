from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class Invoice(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String(50), unique=True, index=True, nullable=False)
    venta_id = Column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False, unique=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    impuestos = Column(Float, nullable=False, default=0.0) # IVA 19% o configurable
    descuento = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    estado = Column(String(30), default="Emitida") # Emitida, Pagada, Anulada
    notas = Column(Text, nullable=True)
    fecha_emision = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    venta = relationship("Sale", back_populates="factura")
    cliente = relationship("User", foreign_keys=[cliente_id])
    pedido = relationship("Order", foreign_keys=[pedido_id])
    detalles = relationship("InvoiceDetail", back_populates="factura", cascade="all, delete-orphan")

class InvoiceDetail(Base):
    __tablename__ = "detalle_facturas"

    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    tipo_item = Column(String(20), nullable=False, default="Producto") # Producto o Servicio
    item_id = Column(Integer, nullable=True)
    descripcion = Column(String(255), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    factura = relationship("Invoice", back_populates="detalles")
