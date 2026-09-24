from .auth import router as auth_router
from .users import router as users_router
from .products import router as products_router
from .services import router as services_router
from .roles import router as roles_router
from .orders import router as orders_router
from .sales import router as sales_router
from .invoices import router as invoices_router
from .pqr import router as pqr_router
from .chatbot import router as chatbot_router
from .purchases import router as purchases_router
from .inventory import router as inventory_router

__all__ = [
    "auth_router",
    "users_router",
    "products_router",
    "services_router",
    "roles_router",
    "orders_router",
    "sales_router",
    "invoices_router",
    "pqr_router",
    "chatbot_router",
    "purchases_router",
    "inventory_router"
]
