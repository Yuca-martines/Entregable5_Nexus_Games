from typing import List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, RolePermission, Permission
from ..utils.security import decode_token

# Esquema de autenticación Bearer para Swagger UI y encabezados HTTP
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Verifica el token JWT enviado en la cabecera Authorization: Bearer <token>.
    Valida firma, expiración y comprueba que el usuario exista y esté Activo.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acceso no autorizado. Token no proporcionado o formato inválido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token no contiene identificación de usuario válida.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de autenticación inválido o expirado: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o sesión caducada.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.estado != "Activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta se encuentra inactiva. Por favor contacta al administrador.",
        )

    # Inyectar dinámicamente rol y permisos en el objeto usuario
    user.rol_nombre = user.rol.nombre if user.rol else "Cliente"
    perms = (
        db.query(Permission.codigo)
        .join(RolePermission, Permission.id == RolePermission.permiso_id)
        .filter(RolePermission.rol_id == user.rol_id)
        .all()
    )
    user.permisos = [p[0] for p in perms]

    return user

def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    """
    Retorna el usuario si el token es válido, o None si no se proporcionó token.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return get_current_user(credentials=credentials, db=db)
    except Exception:
        return None

def require_role(allowed_roles: List[str]) -> Callable:
    """
    Dependencia reutilizable para control de acceso basado en roles (RBAC).
    Permite el acceso solo si el rol del usuario actual está en allowed_roles.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.rol_nombre or "").lower()
        formatted_roles = [r.lower() for r in allowed_roles]

        if user_role not in formatted_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}."
            )
        return current_user

    return role_checker

def require_permission(permission_code: str) -> Callable:
    """
    Dependencia reutilizable para control de acceso basado en permisos granulares.
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        # Administrador tiene acceso total
        if (current_user.rol_nombre or "").lower() == "administrador":
            return current_user

        if not hasattr(current_user, "permisos") or permission_code not in current_user.permisos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Permiso requerido: {permission_code}."
            )
        return current_user

    return permission_checker
