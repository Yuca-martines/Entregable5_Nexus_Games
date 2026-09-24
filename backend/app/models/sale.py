from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class Sale(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    numero_venta = Column(String(50), unique=True, index=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario_operacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    descuento = Column(Float, nullable=False, default=0.0)
    impuestos = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False, default=0.0)
    metodo_pago = Column(String(50), default="Tarjeta de Crédito / En Línea")
    estado = Column(String(30), default="Completada") # Completada, Pendiente, Cancelada
    notas = Column(Text, nullable=True)
    fecha_hora = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    cliente = relationship("User", foreign_keys=[cliente_id])
    usuario_operacion = relationship("User", foreign_keys=[usuario_operacion_id])
    pedido = relationship("Order", back_populates="venta")
    detalles = relationship("SaleDetail", back_populates="venta", cascade="all, delete-orphan")
    factura = relationship("Invoice", back_populates="venta", uselist=False)

class SaleDetail(Base):
    __tablename__ = "detalle_ventas"

    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id", ondelete="CASCADE"), nullable=False)
    tipo_item = Column(String(20), nullable=False, default="Producto") # 'Producto' o 'Servicio'
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=True)
    nombre_item = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Float, nullable=False)
    descuento = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False)

    # Relaciones
    venta = relationship("Sale", back_populates="detalles")
    producto = relationship("Product")
    servicio = relationship("TechnicalService")
