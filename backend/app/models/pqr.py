from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class PQR(Base):
    __tablename__ = "pqr"

    id = Column(Integer, primary_key=True, index=True)
    radicado = Column(String(50), unique=True, index=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Si está autenticado
    cliente_nombre = Column(String(150), nullable=False)
    cliente_email = Column(String(150), nullable=False)
    cliente_telefono = Column(String(30), nullable=True)
    tipo = Column(String(30), nullable=False) # 'Petición', 'Queja', 'Reclamo', 'Sugerencia'
    asunto = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    estado = Column(String(30), default="Pendiente") # 'Pendiente', 'En Proceso', 'Respondida', 'Cerrada'
    respuesta = Column(Text, nullable=True)
    usuario_atencion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) # Empleado o Admin que respondió
    fecha_radicacion = Column(DateTime, server_default=func.current_timestamp())
    fecha_respuesta = Column(DateTime, nullable=True)

    # Relaciones
    usuario = relationship("User", foreign_keys=[usuario_id])
    usuario_atencion = relationship("User", foreign_keys=[usuario_atencion_id])
