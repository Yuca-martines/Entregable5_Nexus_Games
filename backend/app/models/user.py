from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    tipo_documento = Column(String(10), nullable=False)
    numero_documento = Column(String(30), nullable=False, unique=True, index=True)
    direccion = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False, default=3)
    estado = Column(String(20), nullable=False, default="Activo")
    creado_en = Column(DateTime, server_default=func.current_timestamp())
    actualizado_en = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    rol = relationship("Role", back_populates="usuarios")
    pedidos = relationship("Order", back_populates="usuario")
