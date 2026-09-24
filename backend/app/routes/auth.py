from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, RolePermission, Permission
from ..schemas import UserLogin, PasswordRecoveryRequest
from ..utils.security import verify_password, create_access_token
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", summary="Inicio de sesión y generación de JWT")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Autentica al usuario verificando su correo y contraseña mediante hashing seguro (Bcrypt).
    Si las credenciales son válidas y la cuenta está activa, devuelve un JSON Web Token (JWT).
    """
    clean_email = credentials.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Correo o contraseña incorrectos."
        )

    if user.estado != "Activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta ha sido desactivada por un administrador."
        )

    if not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Correo o contraseña incorrectos."
        )

    # Cargar permisos del rol
    perms = (
        db.query(Permission.codigo)
        .join(RolePermission, Permission.id == RolePermission.permiso_id)
        .filter(RolePermission.rol_id == user.rol_id)
        .all()
    )
    permisos_codigos = [p[0] for p in perms]

    rol_nombre = user.rol.nombre if user.rol else "Cliente"

    # Generar Token JWT
    token_payload = {
        "id": user.id,
        "email": user.email,
        "rol_id": user.rol_id,
        "rol_nombre": rol_nombre
    }
    token = create_access_token(token_payload)

    safe_user = {
        "id": user.id,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "nombre_completo": f"{user.nombre} {user.apellido}",
        "tipo_documento": user.tipo_documento,
        "numero_documento": user.numero_documento,
        "direccion": user.direccion,
        "telefono": user.telefono,
        "email": user.email,
        "rol_id": user.rol_id,
        "rol_nombre": rol_nombre,
        "estado": user.estado,
        "permisos": permisos_codigos,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={user.email}",
        "creado_en": user.creado_en
    }

    return {
        "success": True,
        "message": f"¡Bienvenido de nuevo, {user.nombre}!",
        "token": token,
        "user": safe_user
    }

@router.get("/me", summary="Obtener perfil del usuario autenticado")
def get_profile(current_user: User = Depends(get_current_user)):
    """
    Devuelve los datos del usuario identificado mediante el token JWT.
    """
    rol_nombre = current_user.rol.nombre if current_user.rol else "Cliente"
    safe_user = {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "apellido": current_user.apellido,
        "nombre_completo": f"{current_user.nombre} {current_user.apellido}",
        "tipo_documento": current_user.tipo_documento,
        "numero_documento": current_user.numero_documento,
        "direccion": current_user.direccion,
        "telefono": current_user.telefono,
        "email": current_user.email,
        "rol_id": current_user.rol_id,
        "rol_nombre": rol_nombre,
        "estado": current_user.estado,
        "permisos": getattr(current_user, "permisos", []),
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={current_user.email}",
        "creado_en": current_user.creado_en
    }

    return {
        "success": True,
        "user": safe_user
    }

@router.post("/recover-password", summary="Solicitud de recuperación de contraseña")
def recover_password(body: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    """
    Simula el envío de instrucciones de restablecimiento de contraseña.
    """
    clean_email = body.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe una cuenta registrada con este correo electrónico."
        )

    return {
        "success": True,
        "message": f"Se ha enviado un correo con instrucciones de restablecimiento a {body.email}."
    }
