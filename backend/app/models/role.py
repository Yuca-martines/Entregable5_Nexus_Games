from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from ..database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=False)
    creado_en = Column(DateTime, server_default=func.current_timestamp())

    usuarios = relationship("User", back_populates="rol")
    permisos = relationship("RolePermission", back_populates="rol", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permisos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), nullable=False, unique=True)
    nombre = Column(String(100), nullable=False)
    modulo = Column(String(50), nullable=False)
    descripcion = Column(String(255), nullable=True)

    roles = relationship("RolePermission", back_populates="permiso", cascade="all, delete-orphan")

class RolePermission(Base):
    __tablename__ = "rol_permisos"

    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), primary_key=True)

    rol = relationship("Role", back_populates="permisos")
    permiso = relationship("Permission", back_populates="roles")
