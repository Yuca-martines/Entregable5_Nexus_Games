import re
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserRegister(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=40, description="Nombre del usuario (solo letras)")
    apellido: str = Field(..., min_length=2, max_length=40, description="Apellido del usuario (solo letras)")
    tipo_documento: str = Field(..., description="Tipo de documento: CC, CE, TI, PP, NIT")
    numero_documento: str = Field(..., min_length=6, max_length=12, description="Número de documento de identificación")
    direccion: str = Field(..., min_length=5, max_length=100, description="Dirección de residencia o envío")
    telefono: str = Field(..., min_length=10, max_length=10, description="Teléfono celular (10 dígitos)")
    email: EmailStr = Field(..., max_length=80, description="Correo electrónico válido")
    password: str = Field(..., min_length=8, max_length=64, description="Contraseña segura (mínimo 8 caracteres y un símbolo especial)")
    rol_id: Optional[int] = Field(default=3, description="ID de rol asignado (3=Cliente por defecto)")

    @field_validator("nombre", "apellido")
    @classmethod
    def validate_names(cls, v: str) -> str:
        v_clean = v.strip()
        if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", v_clean):
            raise ValueError("Solo se permiten letras y espacios en el nombre y apellido.")
        return v_clean

    @field_validator("tipo_documento")
    @classmethod
    def validate_doc_type(cls, v: str) -> str:
        v_upper = v.upper().strip()
        if v_upper not in ["CC", "CE", "TI", "PP", "NIT"]:
            raise ValueError("Tipo de documento inválido. Debe ser: CC, CE, TI, PP o NIT.")
        return v_upper

    @field_validator("numero_documento")
    @classmethod
    def validate_doc_number(cls, v: str) -> str:
        v_clean = v.strip()
        if not re.match(r"^[0-9a-zA-Z-]+$", v_clean):
            raise ValueError("El documento solo puede contener números, letras y guiones.")
        return v_clean

    @field_validator("telefono")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v_clean = v.strip()
        if not re.match(r"^[0-9]{10}$", v_clean):
            raise ValueError("El teléfono debe contener exactamente 10 dígitos numéricos.")
        return v_clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        special_char_regex = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]"
        if not re.search(special_char_regex, v):
            raise ValueError("La contraseña debe incluir al menos un carácter especial (!, @, #, $, %, *, etc.).")
        return v

class UserLogin(BaseModel):
    email: str = Field(..., description="Correo electrónico")
    password: str = Field(..., description="Contraseña")

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol_id: Optional[int] = None
    estado: Optional[str] = None

    @field_validator("nombre", "apellido")
    @classmethod
    def validate_optional_names(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if not re.match(r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,40}$", v_clean):
                raise ValueError("El nombre/apellido debe contener entre 2 y 40 caracteres y solo letras.")
            return v_clean
        return v

    @field_validator("telefono")
    @classmethod
    def validate_optional_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if not re.match(r"^[0-9]{10}$", v_clean):
                raise ValueError("El número de teléfono debe tener exactamente 10 dígitos numéricos.")
            return v_clean
        return v

    @field_validator("password")
    @classmethod
    def validate_optional_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.strip()) > 0:
            if len(v) < 8 or len(v) > 64:
                raise ValueError("La nueva contraseña debe tener entre 8 y 64 caracteres.")
            if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~`]", v):
                raise ValueError("La nueva contraseña debe incluir al menos un carácter especial.")
            return v
        return None

class UserStatusUpdate(BaseModel):
    estado: Optional[str] = Field(default=None, description="Estado: Activo o Inactivo")

class UserResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    nombre_completo: Optional[str] = None
    tipo_documento: str
    numero_documento: str
    direccion: str
    telefono: str
    email: str
    rol_id: int
    rol_nombre: Optional[str] = None
    estado: str
    avatar: Optional[str] = None
    creado_en: Optional[datetime] = None
    permisos: Optional[List[str]] = []

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserResponse

class PasswordRecoveryRequest(BaseModel):
    email: EmailStr
