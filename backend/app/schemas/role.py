from typing import Optional, List
from pydantic import BaseModel

class PermissionResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    modulo: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str
    permisos: Optional[List[PermissionResponse]] = []

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    totalUsers: int
    totalClients: int
    totalEmployees: int
    totalProducts: int
    lowStockProducts: int
    totalServices: int
    totalOrders: int
    totalRevenue: float

class StatsResponse(BaseModel):
    success: bool
    stats: DashboardStats
