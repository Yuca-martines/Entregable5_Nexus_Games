from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class Category(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)
    icono = Column(String(50), nullable=True)

    productos = relationship("Product", back_populates="categoria")

class Product(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False, index=True)
    descripcion = Column(Text, nullable=False)
    precio = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    plataforma = Column(String(50), default="Multiplataforma")
    imagen = Column(String(500), nullable=False)
    destacado = Column(Integer, default=0)
    estado = Column(String(20), default="Activo")
    creado_en = Column(DateTime, server_default=func.current_timestamp())
    actualizado_en = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    categoria = relationship("Category", back_populates="productos")
    detalles_pedido = relationship("OrderDetail", back_populates="producto")
    movimientos = relationship("InventoryMovement", back_populates="producto", cascade="all, delete-orphan")
