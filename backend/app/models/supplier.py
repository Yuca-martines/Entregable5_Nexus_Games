from sqlalchemy import Column, Integer, String, DateTime, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class Supplier(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nit_rut = Column(String(50), unique=True, nullable=False, index=True)
    razon_social = Column(String(150), nullable=False, index=True)
    contacto_nombre = Column(String(100), nullable=True)
    telefono = Column(String(30), nullable=False)
    email = Column(String(150), nullable=False)
    direccion = Column(String(255), nullable=True)
    ciudad = Column(String(100), default="Bogotá")
    estado = Column(String(20), default="Activo") # Activo, Inactivo
    creado_en = Column(DateTime, server_default=func.current_timestamp())

    # Relaciones
    compras = relationship("Purchase", back_populates="proveedor")
