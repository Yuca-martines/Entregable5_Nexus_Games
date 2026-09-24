from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class Order(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String(50), default="Tarjeta / En Línea")
    estado = Column(String(30), default="Pendiente")
    direccion_envio = Column(String(255), nullable=True)
    notas = Column(String(255), nullable=True)
    motivo_cancelacion = Column(String(255), nullable=True)
    fecha_proceso = Column(DateTime, nullable=True)
    fecha_entrega = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, server_default=func.current_timestamp())

    usuario = relationship("User", back_populates="pedidos")
    items = relationship("OrderDetail", back_populates="pedido", cascade="all, delete-orphan")
    venta = relationship("Sale", back_populates="pedido", uselist=False)

class OrderDetail(Base):
    __tablename__ = "pedido_detalles"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    pedido = relationship("Order", back_populates="items")
    producto = relationship("Product", back_populates="detalles_pedido")
