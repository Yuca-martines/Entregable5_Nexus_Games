from .role import Role, Permission, RolePermission
from .user import User
from .product import Category, Product
from .service import TechnicalService
from .order import Order, OrderDetail
from .sale import Sale, SaleDetail
from .invoice import Invoice, InvoiceDetail
from .pqr import PQR
from .chat import Conversation, ChatMessage
from .supplier import Supplier
from .purchase import Purchase, PurchaseDetail
from .inventory_movement import InventoryMovement

__all__ = [
    "Role",
    "Permission",
    "RolePermission",
    "User",
    "Category",
    "Product",
    "TechnicalService",
    "Order",
    "OrderDetail",
    "Sale",
    "SaleDetail",
    "Invoice",
    "InvoiceDetail",
    "PQR",
    "Conversation",
    "ChatMessage",
    "Supplier",
    "Purchase",
    "PurchaseDetail",
    "InventoryMovement"
]
