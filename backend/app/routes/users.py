from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import User, Role, RolePermission, Permission
from ..schemas import UserRegister, UserUpdate, UserStatusUpdate
from ..utils.security import hash_password, create_access_token
from ..dependencies import get_current_user, require_role

router = APIRouter(tags=["Usuarios"])

def _format_user(u: User) -> dict:
    """Helper para formatear la respuesta del usuario."""
    rol_nombre = u.rol.nombre if u.rol else "Cliente"
    return {
        "id": u.id,
        "nombre": u.nombre,
        "apellido": u.apellido,
        "nombre_completo": f"{u.nombre} {u.apellido}",
        "tipo_documento": u.tipo_documento,
        "numero_documento": u.numero_documento,
        "direccion": u.direccion,
        "telefono": u.telefono,
        "email": u.email,
        "rol_id": u.rol_id,
        "rol_nombre": rol_nombre,
        "estado": u.estado,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={u.email}",
        "creado_en": u.creado_en
    }

# =========================================================================
# 1. REGISTRO DE USUARIOS (POST /api/usuarios/registro Y /api/auth/register)
# =========================================================================
def handle_register(user_data: UserRegister, db: Session):
    clean_email = user_data.email.strip().lower()
    clean_doc = user_data.numero_documento.strip()

    # Verificar si el correo ya existe
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado."
        )

    # Verificar si el documento ya existe
    if db.query(User).filter(User.numero_documento == clean_doc).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de documento ya está asociado a otra cuenta."
        )

    # Hash seguro de contraseña con Bcrypt
    hashed_pass = hash_password(user_data.password)
    final_role_id = user_data.rol_id if user_data.rol_id else 3

    # Crear usuario
    new_user = User(
        nombre=user_data.nombre.strip(),
        apellido=user_data.apellido.strip(),
        tipo_documento=user_data.tipo_documento,
        numero_documento=clean_doc,
        direccion=user_data.direccion.strip(),
        telefono=user_data.telefono.strip(),
        email=clean_email,
        password=hashed_pass,
        rol_id=final_role_id,
        estado="Activo"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    rol_nombre = new_user.rol.nombre if new_user.rol else "Cliente"

    # Token JWT
    token_payload = {
        "id": new_user.id,
        "email": new_user.email,
        "rol_id": new_user.rol_id,
        "rol_nombre": rol_nombre
    }
    token = create_access_token(token_payload)

    formatted = _format_user(new_user)
    formatted["permisos"] = ["PRODUCTS_READ"] if final_role_id == 3 else []

    return {
        "success": True,
        "message": "¡Usuario registrado exitosamente!",
        "token": token,
        "user": formatted
    }

@router.post("/api/usuarios/registro", status_code=status.HTTP_201_CREATED, summary="Registro de nuevo usuario")
def register_usuario(user_data: UserRegister, db: Session = Depends(get_db)):
    return handle_register(user_data, db)

@router.post("/api/auth/register", status_code=status.HTTP_201_CREATED, summary="Alias de registro para compatibilidad Frontend")
def register_auth(user_data: UserRegister, db: Session = Depends(get_db)):
    return handle_register(user_data, db)


# =========================================================================
# 2. LISTAR USUARIOS (GET /api/usuarios Y /api/users) - PROTEGIDO ADMIN/EMPLEADO
# =========================================================================
def handle_get_users(
    search: Optional[str],
    rol_id: Optional[int],
    estado: Optional[str],
    db: Session,
    current_user: User
):
    query = db.query(User)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                User.nombre.ilike(term),
                User.apellido.ilike(term),
                User.email.ilike(term),
                User.numero_documento.ilike(term)
            )
        )

    if rol_id:
        query = query.filter(User.rol_id == rol_id)

    if estado:
        query = query.filter(User.estado == estado)

    users = query.order_by(User.id.desc()).all()
    formatted = [_format_user(u) for u in users]

    return {
        "success": True,
        "count": len(formatted),
        "users": formatted
    }

@router.get("/api/usuarios", summary="Consultar lista de usuarios con filtros (Admin/Empleado)")
def get_usuarios(
    search: Optional[str] = Query(None, description="Búsqueda por nombre, apellido, correo o documento"),
    rol_id: Optional[int] = Query(None, description="Filtrar por rol"),
    estado: Optional[str] = Query(None, description="Filtrar por estado: Activo o Inactivo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_get_users(search, rol_id, estado, db, current_user)

@router.get("/api/users", summary="Alias para listar usuarios (compatibilidad frontend)")
def get_users_alias(
    search: Optional[str] = Query(None),
    rol_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_get_users(search, rol_id, estado, db, current_user)


# =========================================================================
# 3. CREAR USUARIO DESDE PANEL DE ADMINISTRADOR (POST /api/users)
# =========================================================================
@router.post("/api/usuarios", status_code=status.HTTP_201_CREATED, summary="Crear usuario desde panel administrativo")
@router.post("/api/users", status_code=status.HTTP_201_CREATED, summary="Alias crear usuario administrativo")
def create_user_admin(
    user_data: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    res = handle_register(user_data, db)
    return {
        "success": True,
        "message": "Usuario creado exitosamente.",
        "userId": res["user"]["id"]
    }


# =========================================================================
# 4. CONSULTAR USUARIO POR ID (GET /api/usuarios/{id} Y /api/users/{id})
# =========================================================================
def handle_get_user_by_id(id: int, db: Session, current_user: User):
    # Clientes solo pueden consultarse a sí mismos; Admin y Empleado pueden consultar a cualquiera
    user_role = (current_user.rol_nombre or "").lower()
    if user_role == "cliente" and current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No tienes permisos para ver otros usuarios."
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return {
        "success": True,
        "user": _format_user(user)
    }

@router.get("/api/usuarios/{id}", summary="Consultar usuario por ID")
def get_usuario_by_id(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return handle_get_user_by_id(id, db, current_user)

@router.get("/api/users/{id}", summary="Alias consultar usuario por ID")
def get_user_alias(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return handle_get_user_by_id(id, db, current_user)


# =========================================================================
# 5. ACTUALIZAR USUARIO (PUT /api/usuarios/{id} Y /api/users/{id})
# =========================================================================
def handle_update_user(id: int, data: UserUpdate, db: Session, current_user: User):
    user_role = (current_user.rol_nombre or "").lower()
    if user_role == "cliente" and current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No puedes modificar cuentas ajenas."
        )

    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    # Validar duplicados de correo si cambia
    if data.email:
        clean_email = data.email.strip().lower()
        if clean_email != target_user.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El correo electrónico ya pertenece a otro usuario."
                )
            target_user.email = clean_email

    # Validar duplicados de documento si cambia
    if data.numero_documento:
        clean_doc = data.numero_documento.strip()
        if clean_doc != target_user.numero_documento:
            existing_doc = db.query(User).filter(User.numero_documento == clean_doc, User.id != id).first()
            if existing_doc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El documento ya está registrado para otro usuario."
                )
            target_user.numero_documento = clean_doc

    if data.nombre:
        target_user.nombre = data.nombre.strip()
    if data.apellido:
        target_user.apellido = data.apellido.strip()
    if data.tipo_documento:
        target_user.tipo_documento = data.tipo_documento.strip().upper()
    if data.direccion:
        target_user.direccion = data.direccion.strip()
    if data.telefono:
        target_user.telefono = data.telefono.strip()

    # Solo administrador puede cambiar rol o estado
    if user_role == "administrador":
        if data.rol_id is not None:
            target_user.rol_id = data.rol_id
        if data.estado is not None:
            target_user.estado = data.estado

    if data.password:
        target_user.password = hash_password(data.password)

    db.commit()
    db.refresh(target_user)

    return {
        "success": True,
        "message": "Usuario actualizado exitosamente.",
        "user": _format_user(target_user)
    }

@router.put("/api/usuarios/{id}", summary="Actualizar usuario")
def update_usuario(id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return handle_update_user(id, data, db, current_user)

@router.put("/api/users/{id}", summary="Alias actualizar usuario")
def update_user_alias(id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return handle_update_user(id, data, db, current_user)


# =========================================================================
# 6. CAMBIAR ESTADO DE USUARIO (PATCH /api/usuarios/{id}/estado Y /api/users/{id}/status)
# =========================================================================
def handle_toggle_status(id: int, body: UserStatusUpdate, db: Session, current_user: User):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if target_user.email == "admin@nexusgames.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cambiar el estado del Administrador principal del sistema."
        )

    new_status = body.estado if body.estado else ("Inactivo" if target_user.estado == "Activo" else "Activo")
    target_user.estado = new_status
    db.commit()

    return {
        "success": True,
        "message": f"El estado del usuario ahora es: {new_status}",
        "estado": new_status
    }

@router.patch("/api/usuarios/{id}/estado", summary="Cambiar estado del usuario (Activo/Inactivo)")
def toggle_status_usuario(
    id: int,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_toggle_status(id, body, db, current_user)

@router.patch("/api/users/{id}/status", summary="Alias cambiar estado de usuario")
def toggle_status_alias(
    id: int,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_toggle_status(id, body, db, current_user)


# =========================================================================
# 7. ELIMINAR USUARIO (DELETE /api/usuarios/{id} Y /api/users/{id})
# =========================================================================
def handle_delete_user(id: int, db: Session, current_user: User):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if target_user.email == "admin@nexusgames.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el Administrador principal del sistema."
        )

    db.delete(target_user)
    db.commit()

    return {
        "success": True,
        "message": "Usuario eliminado satisfactoriamente."
    }

@router.delete("/api/usuarios/{id}", summary="Eliminar usuario (Admin)")
def delete_usuario(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["Administrador"]))):
    return handle_delete_user(id, db, current_user)

@router.delete("/api/users/{id}", summary="Alias eliminar usuario (Admin)")
def delete_user_alias(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["Administrador"]))):
    return handle_delete_user(id, db, current_user)
