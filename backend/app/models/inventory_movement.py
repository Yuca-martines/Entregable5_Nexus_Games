from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class InventoryMovement(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    tipo_movimiento = Column(String(50), nullable=False) # 'ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE_MANUAL', 'ANULACION_PEDIDO'
    cantidad = Column(Integer, nullable=False) # Positivo o relativo
    stock_anterior = Column(Integer, nullable=False)
    stock_nuevo = Column(Integer, nullable=False)
    motivo = Column(Text, nullable=True)
    referencia = Column(String(100), nullable=True) # Ej: "Compra #COMP-2026-00001", "Pedido #12"
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    producto = relationship("Product", back_populates="movimientos")
    usuario = relationship("User")
