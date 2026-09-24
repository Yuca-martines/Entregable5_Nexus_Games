from sqlalchemy import Column, Integer, String, Float, Text, DateTime, func
from ..database import Base

class TechnicalService(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    precio = Column(Float, nullable=False)
    duracion_estimada = Column(String(50), default="24 Horas")
    icono = Column(String(50), default="Wrench")
    estado = Column(String(20), default="Activo")
    creado_en = Column(DateTime, server_default=func.current_timestamp())
