from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from ..database import Base

class Conversation(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), index=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, server_default=func.current_timestamp())

    usuario = relationship("User")
    mensajes = relationship("ChatMessage", back_populates="conversacion", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id", ondelete="CASCADE"), nullable=False)
    remitente = Column(String(20), nullable=False) # 'user' o 'bot'
    contenido = Column(Text, nullable=False)
    fecha_hora = Column(DateTime, server_default=func.current_timestamp())

    conversacion = relationship("Conversation", back_populates="mensajes")
