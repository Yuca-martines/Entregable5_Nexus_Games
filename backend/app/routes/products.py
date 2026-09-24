from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Product, Category, User
from ..schemas import ProductCreate, ProductUpdate, ProductStockUpdate
from ..dependencies import get_current_user, require_role

router = APIRouter(tags=["Productos"])

def _format_product(p: Product) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio": p.precio,
        "stock": p.stock,
        "categoria_id": p.categoria_id,
        "categoria_nombre": p.categoria.nombre if p.categoria else "General",
        "plataforma": p.plataforma or "Multiplataforma",
        "imagen": p.imagen,
        "destacado": p.destacado,
        "estado": p.estado,
        "creado_en": p.creado_en
    }

# =========================================================================
# CATEGORÍAS
# =========================================================================
@router.get("/api/productos/categories", summary="Listar categorías de productos")
@router.get("/api/products/categories", summary="Alias categorías de productos")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.id.asc()).all()
    formatted = [
        {"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion, "icono": c.icono}
        for c in categories
    ]
    return {
        "success": True,
        "categories": formatted
    }

# =========================================================================
# 1. LISTAR PRODUCTOS CON BÚSQUEDA Y FILTROS
# =========================================================================
def handle_get_products(
    search: Optional[str],
    categoria_id: Optional[int],
    destacado: Optional[int],
    estado: Optional[str],
    minPrice: Optional[float],
    maxPrice: Optional[float],
    db: Session
):
    query = db.query(Product)

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Product.nombre.ilike(term),
                Product.descripcion.ilike(term),
                Product.plataforma.ilike(term)
            )
        )

    if categoria_id:
        query = query.filter(Product.categoria_id == categoria_id)

    if destacado is not None:
        query = query.filter(Product.destacado == destacado)

    if estado:
        query = query.filter(Product.estado == estado)

    if minPrice is not None:
        query = query.filter(Product.precio >= minPrice)

    if maxPrice is not None:
        query = query.filter(Product.precio <= maxPrice)

    products = query.order_by(Product.id.desc()).all()
    formatted = [_format_product(p) for p in products]

    return {
        "success": True,
        "count": len(formatted),
        "products": formatted
    }

@router.get("/api/productos", summary="Consultar catálogo completo de productos")
def get_productos(
    search: Optional[str] = Query(None),
    categoria_id: Optional[int] = Query(None),
    destacado: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    minPrice: Optional[float] = Query(None),
    maxPrice: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    return handle_get_products(search, categoria_id, destacado, estado, minPrice, maxPrice, db)

@router.get("/api/products", summary="Alias consultar productos")
def get_products_alias(
    search: Optional[str] = Query(None),
    categoria_id: Optional[int] = Query(None),
    destacado: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    minPrice: Optional[float] = Query(None),
    maxPrice: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    return handle_get_products(search, categoria_id, destacado, estado, minPrice, maxPrice, db)

# =========================================================================
# 2. CONSULTAR PRODUCTO POR ID
# =========================================================================
def handle_get_product_by_id(id: int, db: Session):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )
    return {
        "success": True,
        "product": _format_product(product)
    }

@router.get("/api/productos/{id}", summary="Consultar producto por ID")
def get_producto_by_id(id: int, db: Session = Depends(get_db)):
    return handle_get_product_by_id(id, db)

@router.get("/api/products/{id}", summary="Alias consultar producto por ID")
def get_product_alias(id: int, db: Session = Depends(get_db)):
    return handle_get_product_by_id(id, db)

# =========================================================================
# 3. CREAR PRODUCTO (ADMIN / EMPLEADO)
# =========================================================================
def handle_create_product(data: ProductCreate, db: Session):
    category = db.query(Category).filter(Category.id == data.categoria_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La categoría con ID {data.categoria_id} no existe."
        )

    new_prod = Product(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion.strip(),
        precio=data.precio,
        stock=data.stock,
        categoria_id=data.categoria_id,
        plataforma=data.plataforma.strip() if data.plataforma else "Multiplataforma",
        imagen=data.imagen.strip() if data.imagen else "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop",
        destacado=data.destacado or 0,
        estado=data.estado or "Activo"
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    return {
        "success": True,
        "message": "Producto creado exitosamente.",
        "productId": new_prod.id,
        "product": _format_product(new_prod)
    }

@router.post("/api/productos", status_code=status.HTTP_201_CREATED, summary="Crear producto (Admin/Empleado)")
def create_producto(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_create_product(data, db)

@router.post("/api/products", status_code=status.HTTP_201_CREATED, summary="Alias crear producto")
def create_product_alias(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_create_product(data, db)

# =========================================================================
# 4. ACTUALIZAR PRODUCTO (ADMIN / EMPLEADO)
# =========================================================================
def handle_update_product(id: int, data: ProductUpdate, db: Session):
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    if data.nombre is not None:
        prod.nombre = data.nombre.strip()
    if data.descripcion is not None:
        prod.descripcion = data.descripcion.strip()
    if data.precio is not None:
        prod.precio = data.precio
    if data.stock is not None:
        prod.stock = data.stock
    if data.categoria_id is not None:
        cat = db.query(Category).filter(Category.id == data.categoria_id).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoría inexistente.")
        prod.categoria_id = data.categoria_id
    if data.plataforma is not None:
        prod.plataforma = data.plataforma
    if data.imagen is not None:
        prod.imagen = data.imagen
    if data.destacado is not None:
        prod.destacado = data.destacado
    if data.estado is not None:
        prod.estado = data.estado

    db.commit()
    db.refresh(prod)

    return {
        "success": True,
        "message": "Producto actualizado satisfactoriamente.",
        "product": _format_product(prod)
    }

@router.put("/api/productos/{id}", summary="Actualizar producto completo")
def update_producto(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_update_product(id, data, db)

@router.put("/api/products/{id}", summary="Alias actualizar producto")
def update_product_alias(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_update_product(id, data, db)

# =========================================================================
# 5. AJUSTAR STOCK DE PRODUCTO (ADMIN / EMPLEADO)
# =========================================================================
def handle_update_stock(id: int, data: ProductStockUpdate, db: Session):
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    if data.stock is not None:
        prod.stock = max(0, data.stock)
    elif data.delta is not None:
        prod.stock = max(0, prod.stock + data.delta)

    db.commit()
    db.refresh(prod)

    return {
        "success": True,
        "message": f'Stock de "{prod.nombre}" actualizado a {prod.stock} unidades.',
        "productId": id,
        "newStock": prod.stock
    }

@router.patch("/api/productos/{id}/stock", summary="Ajustar stock de inventario")
def update_stock_producto(
    id: int,
    data: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_update_stock(id, data, db)

@router.patch("/api/products/{id}/stock", summary="Alias ajustar stock de inventario")
def update_stock_alias(
    id: int,
    data: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador", "Empleado"]))
):
    return handle_update_stock(id, data, db)

# =========================================================================
# 6. ELIMINAR PRODUCTO (ADMIN)
# =========================================================================
def handle_delete_product(id: int, db: Session):
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    db.delete(prod)
    db.commit()

    return {
        "success": True,
        "message": "Producto eliminado correctamente."
    }

@router.delete("/api/productos/{id}", summary="Eliminar producto")
def delete_producto(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_delete_product(id, db)

@router.delete("/api/products/{id}", summary="Alias eliminar producto")
def delete_product_alias(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrador"]))
):
    return handle_delete_product(id, db)
