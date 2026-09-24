import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  usersAPI,
  productsAPI,
  servicesAPI,
  rolesAPI,
  ordersAPI,
  salesAPI,
  invoicesAPI,
  pqrAPI,
  suppliersAPI,
  purchasesAPI,
  inventoryAPI
} from '../services/api';
import {
  Users,
  Package,
  Wrench,
  Shield,
  BarChart3,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Sliders,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  MessageSquare,
  Eye,
  Download,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Filter,
  Truck,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Boxes,
  RotateCcw
} from 'lucide-react';
import {
  exportInventoryToExcel,
  exportInventoryToPDF,
  exportStatisticsToExcel,
  exportStatisticsToPDF,
  exportOrdersToExcel,
  exportOrdersToPDF,
  exportSalesToExcel,
  exportSalesToPDF,
  exportUsersToExcel,
  exportUsersToPDF
} from '../utils/exportReports';
import {
  exportDailyReportToPDF,
  exportDailyReportToExcel,
  exportInvoiceToPDF,
  exportInvoicesToExcel
} from '../utils/exportSalesDaily';
import { formatCOP } from '../utils/formatCurrency';
import SalesChart from '../components/SalesChart';
import InvoiceModal from '../components/InvoiceModal';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import DashboardSidebar from '../components/DashboardSidebar';

function MiniHorizontalBarChart({ data, height = 8, color = '#D4AF37' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      {data.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: '#f8fafc', fontSize: '11px', fontWeight: 700 }}>{item.value}</span>
          </div>
          <div style={{ height: `${height}px`, borderRadius: 999, background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: item.color || color,
                boxShadow: '0 0 12px rgba(212, 175, 55, 0.25)'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniDonutChart({ data }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
      <svg width="110" height="110" viewBox="0 0 120 120" aria-label="chart">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="14" />
        {data.map((item) => {
          const dash = (item.value / total) * circumference;
          const circle = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {data.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
            <span style={{ color: '#cbd5e1' }}>{item.label}</span>
            <span style={{ marginLeft: 'auto', color: '#f8fafc', fontWeight: 700 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Estados de Validación de Formularios
  const [userFormErrors, setUserFormErrors] = useState({});
  const [userSubmitAlert, setUserSubmitAlert] = useState(false);
  const [prodFormErrors, setProdFormErrors] = useState({});
  const [prodSubmitAlert, setProdSubmitAlert] = useState(false);
  const [serviceFormErrors, setServiceFormErrors] = useState({});
  const [serviceSubmitAlert, setServiceSubmitAlert] = useState(false);
  const [stockFormError, setStockFormError] = useState(null);

  // Datos Principales
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalEmployees: 0,
    totalAdmins: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalStockUnits: 0,
    inventoryValuation: 0,
    totalServices: 0,
    totalOrders: 0,
    ordersPending: 0,
    ordersInProcess: 0,
    ordersCompleted: 0,
    ordersCancelled: 0,
    totalSales: 0,
    totalInvoices: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    topProducts: []
  });

  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [pqrList, setPqrList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [inventoryMovementsList, setInventoryMovementsList] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);

  // Filtros
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('');

  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState('');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('');
  const [purchasesSubTab, setPurchasesSubTab] = useState('purchases'); // 'purchases' | 'suppliers'

  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  const [pqrSearch, setPqrSearch] = useState('');
  const [pqrStatusFilter, setPqrStatusFilter] = useState('');
  const [pqrTypeFilter, setPqrTypeFilter] = useState('');
  const [selectedPQR, setSelectedPQR] = useState(null);
  const [isPQRModalOpen, setIsPQRModalOpen] = useState(false);
  const [pqrResponseText, setPqrResponseText] = useState('');
  const [pqrNewStatus, setPqrNewStatus] = useState('Respondida');
  const [isSubmittingPQR, setIsSubmittingPQR] = useState(false);

  // Modales
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'CC',
    numero_documento: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    rol_id: 3,
    estado: 'Activo'
  });

  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFormData, setProdFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria_id: 1,
    plataforma: 'Multiplataforma',
    imagen: '',
    destacado: 0,
    estado: 'Activo'
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState(0);
  const [stockAdjustReason, setStockAdjustReason] = useState('Ajuste de conteo físico');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_estimada: '24 Horas',
    icono: 'Wrench',
    estado: 'Activo'
  });

  // Modal Compra
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Transferencia Bancaria');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { producto_id: '', cantidad: 5, precio_costo_unitario: 0 }
  ]);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // Modal Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    nit_rut: '',
    razon_social: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'Bogotá',
    estado: 'Activo'
  });

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Carga de Datos desde la Base de Datos
  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const sRes = await rolesAPI.getStats();
        if (sRes.success) setStats(sRes.stats);
      } catch (e) {
        console.warn('Stats fetch error', e);
      }

      try {
        const uRes = await usersAPI.getAll();
        if (uRes.success) setUsersList(uRes.users);
      } catch (e) {
        console.warn('Users fetch error', e);
      }

      try {
        const pRes = await productsAPI.getAll();
        if (pRes.success) setProductsList(pRes.products);
        const cRes = await productsAPI.getCategories();
        if (cRes.success) setCategoriesList(cRes.categories);
      } catch (e) {
        console.warn('Products fetch error', e);
      }

      try {
        const srvRes = await servicesAPI.getAll();
        if (srvRes.success) setServicesList(srvRes.services);
      } catch (e) {
        console.warn('Services fetch error', e);
      }

      try {
        const rRes = await rolesAPI.getAll();
        if (rRes.success) setRolesList(rRes.roles);
      } catch (e) {
        console.warn('Roles fetch error', e);
      }

      try {
        const ordRes = await ordersAPI.getAllOrders();
        if (ordRes.success) setOrdersList(ordRes.orders);
      } catch (e) {
        console.warn('Orders fetch error', e);
      }

      try {
        const salesRes = await salesAPI.getAll();
        if (salesRes.success) setSalesList(salesRes.sales);
      } catch (e) {
        console.warn('Sales fetch error', e);
      }

      try {
        const invRes = await invoicesAPI.getAll();
        if (invRes.success) setInvoicesList(invRes.invoices);
      } catch (e) {
        console.warn('Invoices fetch error', e);
      }

      try {
        const pqrRes = await pqrAPI.getAll();
        if (pqrRes.success) setPqrList(pqrRes.pqrs);
      } catch (e) {
        console.warn('PQR fetch error', e);
      }

      try {
        const purRes = await purchasesAPI.getAll();
        if (purRes.success) setPurchasesList(purRes.purchases);
      } catch (e) {
        console.warn('Purchases fetch error', e);
      }

      try {
        const supRes = await suppliersAPI.getAll();
        if (supRes.success) setSuppliersList(supRes.suppliers);
      } catch (e) {
        console.warn('Suppliers fetch error', e);
      }

      try {
        const movRes = await inventoryAPI.getMovements();
        if (movRes.success) setInventoryMovementsList(movRes.movements);
      } catch (e) {
        console.warn('Movements fetch error', e);
      }

      try {
        const sumRes = await inventoryAPI.getSummary();
        if (sumRes.success) setInventorySummary(sumRes.summary);
      } catch (e) {
        console.warn('Inventory summary error', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // TRANSICIONES DE PEDIDOS
  // -------------------------------------------------------------
  const normalizeOrderStatus = (status) => {
    if (!status) return 'Pendiente';
    const clean = String(status).trim();
    if (clean === 'En Proceso') return 'En proceso';
    if (clean === 'Completado') return 'Completada';
    if (clean === 'Cancelado') return 'Cancelada';
    return clean;
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const payload = { estado: nextStatus };
      if (nextStatus === 'Cancelada') {
        const reason = window.prompt('Indica el motivo de cancelación del pedido (el stock se reincorporará automáticamente):', 'Cancelado por revisión administrativa');
        if (!reason) return;
        payload.motivo_cancelacion = reason;
      }
      const res = await ordersAPI.updateStatus(orderId, payload);
      if (res.success) {
        showToast(`Pedido #${orderId} actualizado a ${normalizeOrderStatus(nextStatus)}.`);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar el pedido.', 'error');
    }
  };

  const getOrderStatusBadgeVariant = (status) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === 'Pendiente') return 'warning';
    if (normalized === 'En proceso') return 'info';
    if (normalized === 'Completada') return 'success';
    if (normalized === 'Cancelada') return 'danger';
    return 'default';
  };

  const getStatusActionButtons = (order) => {
    const status = normalizeOrderStatus(order.estado);
    const actions = [];

    if (status === 'Pendiente') {
      actions.push({ label: 'Pasar a En proceso', next: 'En proceso' });
      actions.push({ label: 'Cancelar', next: 'Cancelada', danger: true });
    } else if (status === 'En proceso') {
      actions.push({ label: 'Marcar como Completada', next: 'Completada' });
      actions.push({ label: 'Cancelar', next: 'Cancelada', danger: true });
    }

    return actions;
  };

  // -------------------------------------------------------------
  // ACCIONES DE PRODUCTOS Y STOCK
  // -------------------------------------------------------------
  const handleOpenProdModal = (prod = null) => {
    setProdFormErrors({});
    setProdSubmitAlert(false);
    if (prod) {
      setEditingProduct(prod);
      setProdFormData({
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: prod.precio,
        stock: prod.stock,
        categoria_id: prod.categoria_id,
        plataforma: prod.plataforma,
        imagen: prod.imagen,
        destacado: prod.destacado ? 1 : 0,
        estado: prod.estado
      });
    } else {
      setEditingProduct(null);
      setProdFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: 10,
        categoria_id: categoriesList[0]?.id || 1,
        plataforma: 'Multiplataforma',
        imagen: '',
        destacado: 0,
        estado: 'Activo'
      });
    }
    setIsProdModalOpen(true);
  };

  const handleProdFieldChange = (field, value) => {
    setProdFormData((prev) => ({ ...prev, [field]: value }));
    if (prodFormErrors[field]) {
      setProdFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!prodFormData.nombre || !prodFormData.nombre.trim()) {
      errors.nombre = 'El nombre del producto es obligatorio';
    }
    if (!prodFormData.descripcion || !prodFormData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }
    if (prodFormData.precio === '' || isNaN(prodFormData.precio) || parseFloat(prodFormData.precio) < 0) {
      errors.precio = 'Ingresa un precio válido';
    }
    if (prodFormData.stock === '' || isNaN(prodFormData.stock) || parseInt(prodFormData.stock) < 0) {
      errors.stock = 'Ingresa un stock inicial válido';
    }

    if (Object.keys(errors).length > 0) {
      setProdFormErrors(errors);
      setProdSubmitAlert(true);
      showToast('Por favor completa los campos requeridos en rojo.', 'error');
      return;
    }

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, prodFormData);
        showToast('Producto actualizado exitosamente.');
      } else {
        await productsAPI.create(prodFormData);
        showToast('Producto registrado en el inventario.');
      }
      setIsProdModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al guardar el producto.', 'error');
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${prod.nombre}"?`)) return;
    try {
      await productsAPI.delete(prod.id);
      showToast('Producto eliminado del catálogo.');
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al eliminar producto.', 'error');
    }
  };

  const handleOpenStockModal = (prod) => {
    setSelectedStockProduct(prod);
    setStockAmount(prod.stock);
    setStockAdjustReason('Ajuste de inventario físico');
    setStockFormError(null);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (stockAmount === '' || isNaN(stockAmount) || parseInt(stockAmount) < 0) {
      setStockFormError('El valor del stock debe ser un número entero mayor o igual a 0');
      return;
    }

    try {
      await inventoryAPI.adjustStock({
        producto_id: selectedStockProduct.id,
        nuevo_stock: parseInt(stockAmount),
        motivo: stockAdjustReason || 'Ajuste manual desde panel'
      });
      showToast(`Stock de "${selectedStockProduct.nombre}" actualizado e ingresado al Kardex.`);
      setIsStockModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al actualizar el stock.', 'error');
    }
  };

  const handleQuickStockDelta = async (prod, delta) => {
    try {
      const nuevo = Math.max(0, prod.stock + delta);
      await inventoryAPI.adjustStock({
        producto_id: prod.id,
        nuevo_stock: nuevo,
        motivo: delta > 0 ? 'Aumento rápido de stock (+1)' : 'Disminución rápida de stock (-1)'
      });
      showToast(`Stock de "${prod.nombre}": ${nuevo} unidades.`);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al ajustar stock.', 'error');
    }
  };

  // -------------------------------------------------------------
  // ACCIONES DE COMPRAS Y PROVEEDORES
  // -------------------------------------------------------------
  const handleOpenPurchaseModal = () => {
    if (suppliersList.length === 0) {
      showToast('Debes tener al menos un proveedor registrado antes de crear una compra.', 'error');
      setIsSupplierModalOpen(true);
      return;
    }
    setPurchaseSupplierId(suppliersList[0]?.id || '');
    setPurchasePaymentMethod('Transferencia Bancaria');
    setPurchaseNotes('');
    setPurchaseItems([
      {
        producto_id: productsList[0]?.id || '',
        cantidad: 5,
        precio_costo_unitario: Math.round((productsList[0]?.precio || 100000) * 0.65)
      }
    ]);
    setIsPurchaseModalOpen(true);
  };

  const handleAddPurchaseItem = () => {
    setPurchaseItems((prev) => [
      ...prev,
      {
        producto_id: productsList[0]?.id || '',
        cantidad: 5,
        precio_costo_unitario: Math.round((productsList[0]?.precio || 100000) * 0.65)
      }
    ]);
  };

  const handleRemovePurchaseItem = (index) => {
    if (purchaseItems.length === 1) {
      showToast('La compra debe incluir al menos un producto.', 'error');
      return;
    }
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePurchaseItemChange = (index, field, value) => {
    setPurchaseItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'producto_id') {
        const prod = productsList.find((p) => String(p.id) === String(value));
        if (prod) {
          next[index].precio_costo_unitario = Math.round(prod.precio * 0.65);
        }
      }
      return next;
    });
  };

  const purchaseSubtotalCalc = purchaseItems.reduce(
    (acc, it) => acc + (Number(it.cantidad || 0) * Number(it.precio_costo_unitario || 0)),
    0
  );
  const purchaseIvaCalc = Math.round(purchaseSubtotalCalc * 0.19);
  const purchaseTotalCalc = purchaseSubtotalCalc + purchaseIvaCalc;

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseSupplierId) {
      showToast('Selecciona un proveedor.', 'error');
      return;
    }

    const invalid = purchaseItems.some((it) => !it.producto_id || it.cantidad <= 0 || it.precio_costo_unitario < 0);
    if (invalid) {
      showToast('Verifica que todos los renglones tengan producto, cantidad mayor a 0 y costo válido.', 'error');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const payload = {
        proveedor_id: parseInt(purchaseSupplierId),
        items: purchaseItems.map((it) => ({
          producto_id: parseInt(it.producto_id),
          cantidad: parseInt(it.cantidad),
          precio_costo_unitario: parseFloat(it.precio_costo_unitario)
        })),
        metodo_pago: purchasePaymentMethod,
        notas: purchaseNotes || 'Compra de abastecimiento'
      };

      const res = await purchasesAPI.create(payload);
      if (res.success) {
        showToast(`¡Compra ${res.compra.numero_compra} registrada! El inventario se incrementó automáticamente.`);
        setIsPurchaseModalOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Error al registrar la compra.', 'error');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const handleOpenSupplierModal = (supp = null) => {
    if (supp) {
      setEditingSupplier(supp);
      setSupplierFormData({
        nit_rut: supp.nit_rut,
        razon_social: supp.razon_social,
        contacto_nombre: supp.contacto_nombre || '',
        telefono: supp.telefono,
        email: supp.email,
        direccion: supp.direccion || '',
        ciudad: supp.ciudad || 'Bogotá',
        estado: supp.estado || 'Activo'
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData({
        nit_rut: '',
        razon_social: '',
        contacto_nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: 'Bogotá',
        estado: 'Activo'
      });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.nit_rut.trim() || !supplierFormData.razon_social.trim() || !supplierFormData.email.trim() || !supplierFormData.telefono.trim()) {
      showToast('Por favor completa NIT, Razón Social, Teléfono y Correo del proveedor.', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, supplierFormData);
        showToast('Proveedor actualizado exitosamente.');
      } else {
        await suppliersAPI.create(supplierFormData);
        showToast('Proveedor registrado exitosamente.');
      }
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error al guardar proveedor.', 'error');
    }
  };

  // -------------------------------------------------------------
  // ACCIONES DE USUARIO
  // -------------------------------------------------------------
  const handleOpenUserModal = (u = null) => {
    setUserFormErrors({});
    setUserSubmitAlert(false);
    if (u) {
      setEditingUser(u);
      setUserFormData({
        nombre: u.nombre,
        apellido: u.apellido,
        tipo_documento: u.tipo_documento,
        numero_documento: u.numero_documento,
        direccion: u.direccion,
        telefono: u.telefono,
        email: u.email,
        password: '',
        rol_id: u.rol_id,
        estado: u.estado
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        nombre: '',
        apellido: '',
        tipo_documento: 'CC',
        numero_documento: '',
        direccion: '',
        telefono: '',
        email: '',
        password: '',
        rol_id: 3,
        estado: 'Activo'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleUserFieldChange = (field, value) => {
    setUserFormData((prev) => ({ ...prev, [field]: value }));
    if (userFormErrors[field]) {
      setUserFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const errors = {};
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,40}$/;
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

    if (!userFormData.nombre || !userFormData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (!nameRegex.test(userFormData.nombre.trim())) {
      errors.nombre = 'El nombre debe tener entre 2 y 40 caracteres y solo letras';
    }

    if (!userFormData.apellido || !userFormData.apellido.trim()) {
      errors.apellido = 'El apellido es obligatorio';
    } else if (!nameRegex.test(userFormData.apellido.trim())) {
      errors.apellido = 'El apellido debe tener entre 2 y 40 caracteres y solo letras';
    }

    if (!userFormData.numero_documento || !userFormData.numero_documento.trim()) {
      errors.numero_documento = 'El número de documento es obligatorio';
    } else if (!/^[0-9a-zA-Z-]{6,12}$/.test(userFormData.numero_documento.trim())) {
      errors.numero_documento = 'El documento debe tener entre 6 y 12 caracteres alfanuméricos';
    }

    if (!userFormData.direccion || !userFormData.direccion.trim()) {
      errors.direccion = 'La dirección de residencia es obligatoria';
    }

    if (!userFormData.telefono || !userFormData.telefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio';
    } else if (!/^[0-9]{10}$/.test((userFormData.telefono || '').trim())) {
      errors.telefono = 'El teléfono debe tener exactamente 10 dígitos numéricos';
    }

    if (!userFormData.email || !userFormData.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email.trim())) {
      errors.email = 'Ingresa un formato de correo electrónico válido';
    }

    if (!editingUser) {
      if (!userFormData.password || userFormData.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (!specialCharRegex.test(userFormData.password)) {
        errors.password = 'La contraseña debe incluir al menos un carácter especial (!@#$%&*)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      setUserSubmitAlert(true);
      showToast('Por favor completa todos los campos requeridos en rojo.', 'error');
      return;
    }

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, userFormData);
        showToast('Usuario actualizado con éxito.');
      } else {
        await usersAPI.create(userFormData);
        showToast('Usuario registrado en la base de datos SQL.');
      }
      setIsUserModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al guardar usuario.', 'error');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const newStatus = targetUser.estado === 'Activo' ? 'Inactivo' : 'Activo';
      await usersAPI.toggleStatus(targetUser.id, newStatus);
      showToast(`Estado de ${targetUser.nombre} cambiado a ${newStatus}.`);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al cambiar estado.', 'error');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente al usuario ${targetUser.nombre} ${targetUser.apellido}?`)) return;
    try {
      await usersAPI.delete(targetUser.id);
      showToast('Usuario eliminado del sistema.');
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al eliminar usuario.', 'error');
    }
  };

  // -------------------------------------------------------------
  // ACCIONES DE SERVICIOS
  // -------------------------------------------------------------
  const handleOpenServiceModal = (srv = null) => {
    setServiceFormErrors({});
    setServiceSubmitAlert(false);
    if (srv) {
      setEditingService(srv);
      setServiceFormData({
        nombre: srv.nombre,
        descripcion: srv.descripcion,
        precio: srv.precio,
        duracion_estimada: srv.duracion_estimada,
        icono: srv.icono || 'Wrench',
        estado: srv.estado
      });
    } else {
      setEditingService(null);
      setServiceFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        duracion_estimada: '24 - 48 Horas',
        icono: 'Wrench',
        estado: 'Activo'
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleServiceFieldChange = (field, value) => {
    setServiceFormData((prev) => ({ ...prev, [field]: value }));
    if (serviceFormErrors[field]) {
      setServiceFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!serviceFormData.nombre || !serviceFormData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!serviceFormData.descripcion || !serviceFormData.descripcion.trim()) errors.descripcion = 'La descripción es obligatoria';
    if (serviceFormData.precio === '' || isNaN(serviceFormData.precio) || parseFloat(serviceFormData.precio) < 0) errors.precio = 'Precio inválido';
    if (!serviceFormData.duracion_estimada || !serviceFormData.duracion_estimada.trim()) errors.duracion_estimada = 'Duración estimada obligatoria';

    if (Object.keys(errors).length > 0) {
      setServiceFormErrors(errors);
      setServiceSubmitAlert(true);
      showToast('Por favor completa todos los campos del servicio.', 'error');
      return;
    }

    try {
      if (editingService) {
        await servicesAPI.update(editingService.id, serviceFormData);
        showToast('Servicio actualizado.');
      } else {
        await servicesAPI.create(serviceFormData);
        showToast('Servicio técnico registrado.');
      }
      setIsServiceModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al guardar servicio.', 'error');
    }
  };

  const handleDeleteService = async (srv) => {
    if (!window.confirm(`¿Estás seguro de eliminar el servicio "${srv.nombre}"?`)) return;
    try {
      await servicesAPI.delete(srv.id);
      showToast('Servicio eliminado.');
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al eliminar servicio.', 'error');
    }
  };

  // -------------------------------------------------------------
  // ACCIONES DE PQR
  // -------------------------------------------------------------
  const handleSavePQRResponse = async (e) => {
    e.preventDefault();
    if (!pqrResponseText.trim()) {
      showToast('Por favor escribe una respuesta para la PQR.', 'error');
      return;
    }
    setIsSubmittingPQR(true);
    try {
      const res = await pqrAPI.respond(selectedPQR.id, {
        estado: pqrNewStatus,
        respuesta: pqrResponseText.trim()
      });
      if (res.success) {
        showToast(`PQR ${selectedPQR.radicado} actualizada a ${pqrNewStatus}.`);
        setIsPQRModalOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar PQR.', 'error');
    } finally {
      setIsSubmittingPQR(false);
    }
  };

  // -------------------------------------------------------------
  // LISTAS FILTRADAS
  // -------------------------------------------------------------
  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.apellido.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.numero_documento.includes(userSearch);
    const matchRole = userRoleFilter ? String(u.rol_id) === String(userRoleFilter) : true;
    const matchStatus = userStatusFilter ? u.estado === userStatusFilter : true;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredProducts = productsList.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(prodSearch.toLowerCase());
    const matchCat = prodCategoryFilter ? String(p.categoria_id) === String(prodCategoryFilter) : true;
    return matchSearch && matchCat;
  });

  const filteredInvoices = invoicesList.filter((invoice) => {
    const term = invoiceSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (invoice.numero_factura || '').toLowerCase().includes(term) ||
      (invoice.cliente_nombre || '').toLowerCase().includes(term) ||
      (invoice.cliente_documento || '').toLowerCase().includes(term);
    const matchesDate = !invoiceDateFilter ||
      new Date(invoice.fecha_emision).toISOString().split('T')[0] === invoiceDateFilter;
    return matchesSearch && matchesDate;
  });

  const filteredSales = salesList.filter((sale) => {
    const term = salesSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (sale.numero_venta || '').toLowerCase().includes(term) ||
      (sale.numero_factura || '').toLowerCase().includes(term) ||
      (sale.cliente_nombre || '').toLowerCase().includes(term) ||
      (sale.cliente_documento || '').toLowerCase().includes(term);
    const matchesStatus = !salesStatusFilter || (sale.estado || '').toLowerCase() === salesStatusFilter.toLowerCase();
    const saleDate = sale.fecha_hora ? new Date(sale.fecha_hora) : null;
    const matchesFrom = !salesDateFrom || !saleDate || saleDate >= new Date(`${salesDateFrom}T00:00:00`);
    const matchesTo = !salesDateTo || !saleDate || saleDate <= new Date(`${salesDateTo}T23:59:59`);
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const filteredPurchases = purchasesList.filter((p) => {
    const term = purchaseSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (p.numero_compra || '').toLowerCase().includes(term) ||
      (p.proveedor_nombre || '').toLowerCase().includes(term) ||
      (p.proveedor_nit || '').toLowerCase().includes(term);
    const matchesSupplier = !purchaseSupplierFilter || String(p.proveedor_id) === String(purchaseSupplierFilter);
    return matchesSearch && matchesSupplier;
  });

  const filteredMovements = inventoryMovementsList.filter((m) => {
    const term = movementSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (m.producto_nombre || '').toLowerCase().includes(term) ||
      (m.referencia || '').toLowerCase().includes(term) ||
      (m.motivo || '').toLowerCase().includes(term);
    const matchesType = !movementTypeFilter || m.tipo_movimiento === movementTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredPqr = pqrList.filter((pqr) => {
    const term = (pqrSearch || '').trim().toLowerCase();
    const matchesSearch = !term ||
      (pqr.radicado || '').toLowerCase().includes(term) ||
      (pqr.cliente_nombre || '').toLowerCase().includes(term) ||
      (pqr.asunto || '').toLowerCase().includes(term);
    const matchesStatus = !pqrStatusFilter || pqr.estado === pqrStatusFilter;
    const matchesType = !pqrTypeFilter || pqr.tipo === pqrTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const adminNavItems = [
    { id: 'products', label: 'Productos & Stock', icon: Package, badge: productsList.length },
    { id: 'purchases', label: 'Compras & Proveedores', icon: Truck, badge: purchasesList.length },
    { id: 'inventory_movements', label: 'Kardex de Inventario', icon: Sliders, badge: inventoryMovementsList.length },
    { id: 'orders', label: 'Gestión de Pedidos', icon: ShoppingBag, badge: ordersList.length },
    { id: 'sales', label: 'Historial de Ventas', icon: TrendingUp, badge: salesList.length },
    { id: 'invoices', label: 'Facturas Oficiales', icon: FileText, badge: invoicesList.length },
    { id: 'reports', label: 'Reportes & Analítica', icon: BarChart3 },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users, badge: usersList.length },
    { id: 'services', label: 'Servicios Técnicos', icon: Wrench, badge: servicesList.length },
    { id: 'roles', label: 'Roles y Permisos (RBAC)', icon: Shield },
    { id: 'pqr', label: 'PQR de Clientes', icon: MessageSquare, badge: pqrList.length }
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'products':
        return 'Productos y Control de Inventario';
      case 'purchases':
        return 'Gestión de Compras y Abastecimiento';
      case 'inventory_movements':
        return 'Kardex y Trazabilidad de Movimientos';
      case 'sales':
        return 'Historial Comercial de Ventas';
      case 'invoices':
        return 'Facturas Electrónicas Emitidas';
      case 'reports':
        return 'Centro de Analítica, Balance y Reportes';
      case 'users':
        return 'Directorio y Control de Usuarios';
      case 'services':
        return 'Servicios Técnicos Especializados';
      case 'roles':
        return 'Matriz de Permisos por Rol (RBAC)';
      case 'pqr':
        return 'Gestión y Respuesta de PQR';
      case 'orders':
        return 'Control de Pedidos y Transiciones';
      default:
        return 'Panel Administrativo Nexus Games';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <DashboardSidebar
        title="Panel Administrativo"
        roleBadge="Administrador"
        icon={Shield}
        navItems={adminNavItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ÁREA DE TRABAJO */}
      <div className="dashboard-content-area">
        {/* HEADER */}
        <header className="dashboard-top-header">
          <div className="header-title-block">
            <div className="dashboard-breadcrumb-sub">ADMINISTRACIÓN / {activeTab.toUpperCase()}</div>
            <h1 className="header-main-title">{getTabTitle()}</h1>
            <p className="header-sub-text">
              Nexus Games • Sincronizado en tiempo real con Base de Datos Relacional SQL
            </p>
          </div>

          <div className="header-actions-group">
            <button
              type="button"
              className="sync-db-btn"
              onClick={loadData}
              disabled={loading}
              title="Sincronizar datos reales con la Base de Datos SQL"
            >
              <span className="live-db-dot"></span>
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Sincronizando...' : 'Sincronizar con DB'}</span>
            </button>

            {activeTab === 'products' && (
              <>
                <div className="export-btn-group">
                  <button
                    type="button"
                    className="export-btn export-btn-excel"
                    onClick={() => exportInventoryToExcel(filteredProducts)}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    type="button"
                    className="export-btn export-btn-pdf"
                    onClick={() => exportInventoryToPDF(filteredProducts, stats)}
                  >
                    <FileText size={16} />
                    <span>Exportar PDF</span>
                  </button>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => handleOpenProdModal()}>
                  Agregar Producto
                </Button>
              </>
            )}

            {activeTab === 'purchases' && (
              <div className="export-btn-group">
                <Button variant="primary" icon={Plus} onClick={handleOpenPurchaseModal}>
                  Registrar Compra
                </Button>
                <Button variant="outline" icon={Truck} onClick={() => handleOpenSupplierModal()}>
                  Nuevo Proveedor
                </Button>
              </div>
            )}

            {activeTab === 'inventory_movements' && (
              <Button variant="outline" icon={Sliders} onClick={() => {
                if (productsList.length > 0) handleOpenStockModal(productsList[0]);
              }}>
                Ajuste de Conteo Físico
              </Button>
            )}

            {activeTab === 'sales' && (
              <div className="export-btn-group">
                <button
                  type="button"
                  className="export-btn export-btn-excel"
                  onClick={() => exportSalesToExcel(filteredSales)}
                >
                  <FileSpreadsheet size={16} />
                  <span>Ventas Excel</span>
                </button>
                <button
                  type="button"
                  className="export-btn export-btn-pdf"
                  onClick={() => exportSalesToPDF(filteredSales)}
                >
                  <FileText size={16} />
                  <span>Ventas PDF</span>
                </button>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="export-btn-group">
                <button
                  type="button"
                  className="export-btn export-btn-excel"
                  onClick={() => exportInvoicesToExcel(filteredInvoices)}
                >
                  <FileSpreadsheet size={16} />
                  <span>Facturas Excel</span>
                </button>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="export-btn-group">
                <button
                  type="button"
                  className="export-btn export-btn-excel"
                  onClick={() => exportOrdersToExcel(ordersList)}
                >
                  <FileSpreadsheet size={16} />
                  <span>Exportar Excel</span>
                </button>
                <button
                  type="button"
                  className="export-btn export-btn-pdf"
                  onClick={() => exportOrdersToPDF(ordersList)}
                >
                  <FileText size={16} />
                  <span>Exportar PDF</span>
                </button>
              </div>
            )}

            {activeTab === 'users' && (
              <>
                <div className="export-btn-group">
                  <button
                    type="button"
                    className="export-btn export-btn-excel"
                    onClick={() => exportUsersToExcel(usersList)}
                  >
                    <FileSpreadsheet size={16} />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    type="button"
                    className="export-btn export-btn-pdf"
                    onClick={() => exportUsersToPDF(usersList)}
                  >
                    <FileText size={16} />
                    <span>Exportar PDF</span>
                  </button>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => handleOpenUserModal()}>
                  Nuevo Usuario
                </Button>
              </>
            )}

            {activeTab === 'reports' && (
              <div className="export-btn-group">
                <button
                  type="button"
                  className="export-btn export-btn-excel"
                  onClick={() => exportStatisticsToExcel(stats, productsList, ordersList, usersList)}
                >
                  <FileSpreadsheet size={16} />
                  <span>Consolidado Excel</span>
                </button>
                <button
                  type="button"
                  className="export-btn export-btn-pdf"
                  onClick={() => exportStatisticsToPDF(stats, productsList, ordersList, usersList)}
                >
                  <FileText size={16} />
                  <span>Informe PDF</span>
                </button>
              </div>
            )}

            {activeTab === 'services' && (
              <Button variant="primary" icon={Plus} onClick={() => handleOpenServiceModal()}>
                Nuevo Servicio
              </Button>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="dashboard-main-content">
          {feedbackMsg && (
            <div className={`toast-notification toast-${feedbackMsg.type}`}>
              {feedbackMsg.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Tarjetas de Métricas Reales */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper gold-bg">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="stat-label">Ingresos por Ventas</span>
                <div className="stat-value">{formatCOP(stats.totalRevenue || 0)}</div>
                <span className="stat-sub">{stats.totalOrders || ordersList.length} pedidos procesados</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper blue-bg" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <Truck size={24} />
              </div>
              <div>
                <span className="stat-label">Gastos en Compras</span>
                <div className="stat-value" style={{ color: '#60a5fa' }}>{formatCOP(stats.totalExpenses || 0)}</div>
                <span className="stat-sub">{stats.totalPurchases || purchasesList.length} compras de stock</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: (stats.netProfit || 0) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: (stats.netProfit || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span className="stat-label">Balance Neto Operativo</span>
                <div className="stat-value" style={{ color: (stats.netProfit || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                  {formatCOP(stats.netProfit || 0)}
                </div>
                <span className="stat-sub">Ventas menos Compras</span>
              </div>
            </div>

            <div className="stat-card">
              <div className={`stat-icon-wrapper ${stats.lowStockProducts > 0 ? 'alert-bg' : 'gold-bg'}`}>
                <Package size={24} />
              </div>
              <div>
                <span className="stat-label">Stock en Bodega</span>
                <div className="stat-value">{stats.totalStockUnits || productsList.reduce((acc, p) => acc + (p.stock || 0), 0)} u.</div>
                <span className="stat-sub text-gold">{stats.lowStockProducts || 0} con stock crítico (&le; 5)</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              PESTAÑA 1: PRODUCTOS Y STOCK
             ========================================================================= */}
          {activeTab === 'products' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, descripción o plataforma..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>

                <div className="filter-group">
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Todas las Categorías</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio (COP)</th>
                      <th>Stock Actual</th>
                      <th>Ajuste Rápido de Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">
                          No se encontraron productos coincidentes.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <div className="product-table-cell">
                              <img src={prod.imagen} alt={prod.nombre} className="product-table-thumb" />
                              <div>
                                <strong className="product-title-text">{prod.nombre}</strong>
                                <div className="product-meta-sub">
                                  <span>{prod.plataforma}</span>
                                  {prod.destacado === 1 && <span className="gold-pill">Destacado</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{prod.categoria_nombre || 'General'}</td>
                          <td>
                            <strong className="price-tag">{formatCOP(prod.precio)}</strong>
                          </td>
                          <td>
                            <div className="stock-cell-display">
                              <span
                                className={`stock-badge ${prod.stock === 0
                                  ? 'stock-out'
                                  : prod.stock <= 5
                                    ? 'stock-low'
                                    : 'stock-ok'
                                  }`}
                              >
                                {prod.stock === 0 ? 'Sin Stock (0)' : `${prod.stock} disp.`}
                              </span>
                              <button
                                className="stock-edit-btn"
                                onClick={() => handleOpenStockModal(prod)}
                                title="Ajustar Stock Manualmente"
                              >
                                <Sliders size={14} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="quick-stock-controls">
                              <button
                                className="quick-stock-btn minus"
                                onClick={() => handleQuickStockDelta(prod, -1)}
                                title="Restar 1"
                              >
                                -1
                              </button>
                              <button
                                className="quick-stock-btn plus"
                                onClick={() => handleQuickStockDelta(prod, 1)}
                                title="Sumar 1"
                              >
                                +1
                              </button>
                            </div>
                          </td>
                          <td>
                            <Badge variant={prod.estado === 'Activo' ? 'success' : 'danger'}>
                              {prod.estado}
                            </Badge>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="action-icon-btn edit"
                                onClick={() => handleOpenProdModal(prod)}
                                title="Editar Producto"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="action-icon-btn delete"
                                onClick={() => handleDeleteProduct(prod)}
                                title="Eliminar Producto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 2: COMPRAS & PROVEEDORES (FLUJO REAL DE REABASTECIMIENTO)
             ========================================================================= */}
          {activeTab === 'purchases' && (
            <div className="tab-content">
              {/* Selector de Sub-pestaña */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setPurchasesSubTab('purchases')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    background: purchasesSubTab === 'purchases' ? '#D4AF37' : '#12161f',
                    color: purchasesSubTab === 'purchases' ? '#000' : '#cbd5e1',
                    border: '1px solid rgba(212,175,55,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <ShoppingBag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Historial de Compras ({purchasesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPurchasesSubTab('suppliers')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    background: purchasesSubTab === 'suppliers' ? '#D4AF37' : '#12161f',
                    color: purchasesSubTab === 'suppliers' ? '#000' : '#cbd5e1',
                    border: '1px solid rgba(212,175,55,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <Truck size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Directorio de Proveedores ({suppliersList.length})
                </button>
              </div>

              {purchasesSubTab === 'purchases' ? (
                <>
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar por número de compra o proveedor..."
                        value={purchaseSearch}
                        onChange={(e) => setPurchaseSearch(e.target.value)}
                        className="custom-search-input"
                      />
                    </div>
                  </div>

                  <div className="table-responsive-card">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th>Número Compra</th>
                          <th>Proveedor</th>
                          <th>Fecha / Hora</th>
                          <th>Renglones / Productos</th>
                          <th>Total Compra</th>
                          <th>Método de Pago</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPurchases.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-6 text-muted">
                              No hay compras registradas con los filtros actuales.
                            </td>
                          </tr>
                        ) : (
                          filteredPurchases.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <strong className="font-mono text-gold">{p.numero_compra}</strong>
                              </td>
                              <td>
                                <strong>{p.proveedor_nombre}</strong>
                                <div className="text-xs text-slate-400">NIT: {p.proveedor_nit}</div>
                              </td>
                              <td>{new Date(p.fecha_hora).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {p.detalles?.map((d, i) => (
                                    <span key={i} className="text-xs text-slate-300">
                                      • {d.producto_nombre} <strong>(x{d.cantidad} u. a {formatCOP(d.precio_costo_unitario)})</strong>
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <strong className="price-tag text-emerald-400">{formatCOP(p.total)}</strong>
                              </td>
                              <td>{p.metodo_pago}</td>
                              <td>
                                <Badge variant="success">{p.estado}</Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="table-responsive-card">
                  <table className="custom-data-table">
                    <thead>
                      <tr>
                        <th>NIT / RUT</th>
                        <th>Razón Social</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Ciudad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersList.map((s) => (
                        <tr key={s.id}>
                          <td><strong className="font-mono">{s.nit_rut}</strong></td>
                          <td><strong>{s.razon_social}</strong></td>
                          <td>{s.contacto_nombre || 'N/A'}</td>
                          <td>{s.telefono}</td>
                          <td>{s.email}</td>
                          <td>{s.ciudad}</td>
                          <td><Badge variant={s.estado === 'Activo' ? 'success' : 'danger'}>{s.estado}</Badge></td>
                          <td>
                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenSupplierModal(s)}
                              title="Editar Proveedor"
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 3: KARDEX DE INVENTARIO (TRAZABILIDAD EN TIEMPO REAL)
             ========================================================================= */}
          {activeTab === 'inventory_movements' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por producto, referencia o motivo..."
                    value={movementSearch}
                    onChange={(e) => setMovementSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>

                <div className="filter-group">
                  <select
                    value={movementTypeFilter}
                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Todos los Tipos de Movimiento</option>
                    <option value="ENTRADA_COMPRA">Entradas por Compra</option>
                    <option value="SALIDA_VENTA">Salidas por Venta</option>
                    <option value="AJUSTE_MANUAL">Ajustes Manuales</option>
                    <option value="ANULACION_PEDIDO">Reintegros por Cancelación</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Producto</th>
                      <th>Tipo Movimiento</th>
                      <th>Stock Anterior</th>
                      <th>Variación (Delta)</th>
                      <th>Stock Resultante</th>
                      <th>Referencia / Motivo</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-6 text-muted">
                          No hay movimientos registrados en el Kardex.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((m) => {
                        const isPositive = m.cantidad > 0 || m.tipo_movimiento.includes('ENTRADA') || m.tipo_movimiento.includes('ANULACION');
                        return (
                          <tr key={m.id}>
                            <td className="text-xs text-slate-400">
                              {new Date(m.creado_en).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td>
                              <div className="product-table-cell">
                                {m.producto_imagen && <img src={m.producto_imagen} alt="" className="product-table-thumb" />}
                                <strong>{m.producto_nombre}</strong>
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: m.tipo_movimiento === 'ENTRADA_COMPRA' ? 'rgba(16, 185, 129, 0.15)' : m.tipo_movimiento === 'SALIDA_VENTA' ? 'rgba(59, 130, 246, 0.15)' : m.tipo_movimiento === 'ANULACION_PEDIDO' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                  color: m.tipo_movimiento === 'ENTRADA_COMPRA' ? '#10B981' : m.tipo_movimiento === 'SALIDA_VENTA' ? '#60A5FA' : m.tipo_movimiento === 'ANULACION_PEDIDO' ? '#EF4444' : '#FFDF73'
                                }}
                              >
                                {m.tipo_movimiento}
                              </span>
                            </td>
                            <td className="font-mono">{m.stock_anterior} u.</td>
                            <td>
                              <strong className={isPositive ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad} u.
                              </strong>
                            </td>
                            <td className="font-mono"><strong>{m.stock_nuevo} u.</strong></td>
                            <td>
                              <div className="text-xs">
                                <strong>{m.referencia || 'N/A'}</strong>
                                <div className="text-slate-400">{m.motivo}</div>
                              </div>
                            </td>
                            <td className="text-xs text-slate-300">{m.usuario_nombre || 'Sistema'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 4: GESTIÓN DE PEDIDOS Y TRANSICIÓN DE ESTADOS REALES
             ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="tab-content">
              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>ID Pedido</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Productos Solicitados</th>
                      <th>Total</th>
                      <th>Factura Asociada</th>
                      <th>Estado Actual</th>
                      <th>Acciones de Transición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-6 text-muted">
                          No hay pedidos registrados en la base de datos.
                        </td>
                      </tr>
                    ) : (
                      ordersList.map((o) => {
                        const actions = getStatusActionButtons(o);
                        return (
                          <tr key={o.id}>
                            <td><strong className="font-mono text-gold">#{o.id}</strong></td>
                            <td>
                              <strong>{o.cliente_nombre} {o.cliente_apellido}</strong>
                              <div className="text-xs text-slate-400">{o.cliente_email} • {o.cliente_documento}</div>
                            </td>
                            <td className="text-xs text-slate-400">
                              {new Date(o.creado_en).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {o.items?.map((it, i) => (
                                  <span key={i} className="text-xs text-slate-300">
                                    • {it.producto_nombre} <strong>(x{it.cantidad})</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td><strong className="price-tag">{formatCOP(o.total)}</strong></td>
                            <td>
                              {o.numero_factura ? (
                                <span className="doc-badge font-mono">{o.numero_factura}</span>
                              ) : (
                                <span className="text-xs text-slate-500">Pendiente emisión</span>
                              )}
                            </td>
                            <td>
                              <Badge variant={getOrderStatusBadgeVariant(o.estado)}>
                                {normalizeOrderStatus(o.estado)}
                              </Badge>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {actions.length === 0 ? (
                                  <span className="text-xs text-slate-500">Estado final</span>
                                ) : (
                                  actions.map((act, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, act.next)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        background: act.danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                        color: act.danger ? '#EF4444' : '#FFDF73',
                                        border: `1px solid ${act.danger ? 'rgba(239,68,68,0.3)' : 'rgba(212,175,55,0.3)'}`,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {act.label}
                                    </button>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 5: HISTORIAL COMERCIAL DE VENTAS
             ========================================================================= */}
          {activeTab === 'sales' && (
            <div className="tab-content">
              <SalesChart sales={salesList} />

              <div className="table-responsive-card" style={{ marginTop: '20px' }}>
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>N° Venta</th>
                      <th>Cliente</th>
                      <th>Fecha / Hora</th>
                      <th>Subtotal</th>
                      <th>IVA (19%)</th>
                      <th>Total</th>
                      <th>Factura Asociada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s) => (
                      <tr key={s.id}>
                        <td><strong className="font-mono text-gold">{s.numero_venta}</strong></td>
                        <td>
                          <strong>{s.cliente_nombre}</strong>
                          <div className="text-xs text-slate-400">{s.cliente_documento}</div>
                        </td>
                        <td className="text-xs text-slate-400">
                          {new Date(s.fecha_hora).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>{formatCOP(s.subtotal)}</td>
                        <td>{formatCOP(s.impuestos)}</td>
                        <td><strong className="price-tag text-emerald-400">{formatCOP(s.total)}</strong></td>
                        <td>
                          {s.numero_factura ? (
                            <span className="doc-badge font-mono">{s.numero_factura}</span>
                          ) : (
                            <span className="text-xs text-slate-500">N/A</span>
                          )}
                        </td>
                        <td><Badge variant={s.estado === 'Completada' ? 'success' : 'danger'}>{s.estado}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 6: FACTURAS EMITIDAS
             ========================================================================= */}
          {activeTab === 'invoices' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar factura por número o cliente..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>N° Factura</th>
                      <th>Cliente</th>
                      <th>Documento</th>
                      <th>Fecha Emisión</th>
                      <th>Total Facturado</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong className="font-mono text-gold">{inv.numero_factura}</strong></td>
                        <td><strong>{inv.cliente_nombre}</strong></td>
                        <td>{inv.cliente_documento}</td>
                        <td className="text-xs text-slate-400">
                          {new Date(inv.fecha_emision).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })}
                        </td>
                        <td><strong className="price-tag">{formatCOP(inv.total)}</strong></td>
                        <td><Badge variant={inv.estado === 'Emitida' ? 'success' : 'danger'}>{inv.estado}</Badge></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsInvoiceModalOpen(true);
                              }}
                              className="action-icon-btn edit"
                              title="Ver Factura"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportInvoiceToPDF(inv)}
                              className="action-icon-btn"
                              style={{ color: '#D4AF37' }}
                              title="Descargar PDF"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 7: REPORTES Y ANALÍTICA (DATOS 100% REALES DE BD)
             ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="tab-content reports-dashboard">
              <div className="reports-hero-banner" style={{ marginBottom: '20px' }}>
                <div className="reports-hero-text">
                  <h2>
                    <BarChart3 className="text-gold" size={26} />
                    Centro de Analítica y Reportes Reales Nexus Games
                  </h2>
                  <p>
                    Indicadores consolidados calculados directamente desde la base de datos SQL.
                    Auditoría de compras, ingresos, márgenes de ganancia y trazabilidad de pedidos.
                  </p>
                </div>
              </div>

              <div className="reports-grid">
                {/* Tarjeta 1: Desglose de Pedidos */}
                <div className="report-card">
                  <div className="report-card-header">
                    <div className="report-card-icon blue">
                      <ShoppingBag size={26} />
                    </div>
                    <div>
                      <h3 className="report-card-title">Distribución Real de Pedidos</h3>
                      <p className="report-card-desc">Estado actual de las órdenes en base de datos.</p>
                    </div>
                  </div>
                  <div className="report-card-meta">
                    <div className="report-card-meta-item"><span>Pendientes</span><span className="text-amber-400">{stats.ordersPending || 0}</span></div>
                    <div className="report-card-meta-item"><span>En Proceso</span><span className="text-blue-400">{stats.ordersInProcess || 0}</span></div>
                    <div className="report-card-meta-item"><span>Completadas</span><span className="text-emerald-400">{stats.ordersCompleted || 0}</span></div>
                    <div className="report-card-meta-item"><span>Canceladas</span><span className="text-rose-400">{stats.ordersCancelled || 0}</span></div>
                  </div>
                  <MiniHorizontalBarChart
                    data={[
                      { label: 'Completadas', value: stats.ordersCompleted || 0, color: '#10B981' },
                      { label: 'En proceso', value: stats.ordersInProcess || 0, color: '#60A5FA' },
                      { label: 'Pendientes', value: stats.ordersPending || 0, color: '#F59E0B' },
                      { label: 'Canceladas', value: stats.ordersCancelled || 0, color: '#EF4444' }
                    ]}
                  />
                </div>

                {/* Tarjeta 2: Balance Financiero */}
                <div className="report-card">
                  <div className="report-card-header">
                    <div className="report-card-icon emerald">
                      <TrendingUp size={26} />
                    </div>
                    <div>
                      <h3 className="report-card-title">Balance y Rentabilidad</h3>
                      <p className="report-card-desc">Ingresos por ventas frente a costos de abastecimiento.</p>
                    </div>
                  </div>
                  <div className="report-card-meta">
                    <div className="report-card-meta-item"><span>Ingresos Ventas</span><span className="text-emerald-400">{formatCOP(stats.totalRevenue || 0)}</span></div>
                    <div className="report-card-meta-item"><span>Gastos Compras</span><span className="text-rose-400">{formatCOP(stats.totalExpenses || 0)}</span></div>
                    <div className="report-card-meta-item"><span>Margen Operativo</span><span className="text-gold font-bold">{formatCOP(stats.netProfit || 0)}</span></div>
                  </div>
                  <MiniDonutChart
                    data={[
                      { label: 'Ingresos', value: Math.max(1, Math.round((stats.totalRevenue || 0) / 1000)), color: '#10B981' },
                      { label: 'Costos Compras', value: Math.max(1, Math.round((stats.totalExpenses || 0) / 1000)), color: '#EF4444' }
                    ]}
                  />
                </div>

                {/* Tarjeta 3: Top Productos Más Vendidos */}
                <div className="report-card" style={{ gridColumn: 'span 2' }}>
                  <div className="report-card-header">
                    <div className="report-card-icon gold">
                      <Package size={26} />
                    </div>
                    <div>
                      <h3 className="report-card-title">Top 5 Productos Más Vendidos (Calculado en BD)</h3>
                      <p className="report-card-desc">Productos con mayor volumen de venta y recaudación real.</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th>Ranking</th>
                          <th>Producto</th>
                          <th>Unidades Vendidas</th>
                          <th>Total Recaudado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.topProducts || []).length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-4 text-muted">Aún no se registran ventas para calcular el ranking.</td></tr>
                        ) : (
                          stats.topProducts.map((tp, i) => (
                            <tr key={tp.producto_id}>
                              <td><strong className="text-gold">#{i + 1}</strong></td>
                              <td>
                                <div className="product-table-cell">
                                  {tp.imagen && <img src={tp.imagen} alt="" className="product-table-thumb" />}
                                  <strong>{tp.nombre}</strong>
                                </div>
                              </td>
                              <td><strong className="font-mono">{tp.total_vendido} unidades</strong></td>
                              <td><strong className="price-tag text-emerald-400">{formatCOP(tp.total_recaudado)}</strong></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 8: USUARIOS
             ========================================================================= */}
          {activeTab === 'users' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido, correo o documento..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Documento</th>
                      <th>Teléfono</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Cambiar Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-table-cell">
                            <img src={u.avatar} alt="" className="user-table-avatar" />
                            <div>
                              <strong>{u.nombre} {u.apellido}</strong>
                              <div className="user-email-text">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="doc-badge">{u.tipo_documento}</span> {u.numero_documento}</td>
                        <td>{u.telefono}</td>
                        <td><span className={`role-badge role-${u.rol_nombre?.toLowerCase()}`}>{u.rol_nombre}</span></td>
                        <td><Badge variant={u.estado === 'Activo' ? 'success' : 'danger'}>{u.estado}</Badge></td>
                        <td>
                          <button
                            className={`status-toggle-btn ${u.estado === 'Activo' ? 'is-active' : 'is-inactive'}`}
                            onClick={() => handleToggleUserStatus(u)}
                          >
                            {u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="action-icon-btn edit" onClick={() => handleOpenUserModal(u)}><Edit2 size={16} /></button>
                            <button className="action-icon-btn delete" onClick={() => handleDeleteUser(u)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 9: SERVICIOS
             ========================================================================= */}
          {activeTab === 'services' && (
            <div className="tab-content">
              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Descripción</th>
                      <th>Precio Estimado</th>
                      <th>Duración</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesList.map((srv) => (
                      <tr key={srv.id}>
                        <td><strong>{srv.nombre}</strong></td>
                        <td style={{ maxWidth: '300px' }}>{srv.descripcion}</td>
                        <td><strong className="price-tag">{formatCOP(srv.precio)}</strong></td>
                        <td>{srv.duracion_estimada}</td>
                        <td><Badge variant={srv.estado === 'Activo' ? 'success' : 'danger'}>{srv.estado}</Badge></td>
                        <td>
                          <div className="table-actions">
                            <button className="action-icon-btn edit" onClick={() => handleOpenServiceModal(srv)}><Edit2 size={16} /></button>
                            <button className="action-icon-btn delete" onClick={() => handleDeleteService(srv)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 10: ROLES Y PERMISOS (RBAC)
             ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="tab-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {rolesList.map((r) => (
                  <div key={r.id} className="report-card" style={{ background: '#0e121a', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Shield size={22} className="text-gold" />
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>{r.nombre}</h3>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>{r.descripcion}</p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase' }}>Permisos Asignados:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                        {r.permisos?.map((p) => (
                          <span key={p.id} className="doc-badge" style={{ fontSize: '10px' }}>{p.nombre}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 11: PQR
             ========================================================================= */}
          {activeTab === 'pqr' && (
            <div className="tab-content">
              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Radicado</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Asunto</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPqr.map((p) => (
                      <tr key={p.id}>
                        <td><strong className="font-mono text-gold">{p.radicado}</strong></td>
                        <td>{p.cliente_nombre}</td>
                        <td><Badge variant="info">{p.tipo}</Badge></td>
                        <td>{p.asunto}</td>
                        <td><Badge variant={p.estado === 'Respondida' ? 'success' : p.estado === 'En Proceso' ? 'warning' : 'danger'}>{p.estado}</Badge></td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPQR(p);
                              setPqrResponseText(p.respuesta || '');
                              setPqrNewStatus(p.estado === 'Pendiente' ? 'Respondida' : p.estado);
                              setIsPQRModalOpen(true);
                            }}
                            className="status-toggle-btn"
                          >
                            Atender PQR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: REGISTRAR COMPRA A PROVEEDOR (ABASTECIMIENTO)
         ========================================================================= */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Registrar Compra de Mercancía a Proveedor"
        maxWidth="750px"
      >
        <form onSubmit={handleSavePurchase} className="auth-form" noValidate>
          <div className="auth-form-grid">
            <div className="input-field-group">
              <label className="input-label">Proveedor Seleccionado *</label>
              <select
                value={purchaseSupplierId}
                onChange={(e) => setPurchaseSupplierId(e.target.value)}
                className="custom-select"
                required
              >
                {suppliersList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.razon_social} (NIT: {s.nit_rut})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-field-group">
              <label className="input-label">Método de Pago</label>
              <select
                value={purchasePaymentMethod}
                onChange={(e) => setPurchasePaymentMethod(e.target.value)}
                className="custom-select"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Crédito Proveedor (30 días)">Crédito Proveedor (30 días)</option>
                <option value="Cheque Corporativo">Cheque Corporativo</option>
                <option value="Efectivo">Efectivo / Caja Menor</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ color: '#D4AF37', fontSize: '13px', textTransform: 'uppercase' }}>Productos a Ingresar:</strong>
              <Button type="button" variant="outline" icon={Plus} onClick={handleAddPurchaseItem}>
                Agregar Renglón
              </Button>
            </div>

            {purchaseItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <select
                  value={item.producto_id}
                  onChange={(e) => handlePurchaseItemChange(idx, 'producto_id', e.target.value)}
                  className="custom-select"
                  required
                >
                  <option value="">Seleccione Producto...</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock})
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={item.cantidad}
                  onChange={(e) => handlePurchaseItemChange(idx, 'cantidad', e.target.value)}
                />

                <Input
                  type="number"
                  min="0"
                  placeholder="Costo unitario"
                  value={item.precio_costo_unitario}
                  onChange={(e) => handlePurchaseItemChange(idx, 'precio_costo_unitario', e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => handleRemovePurchaseItem(idx)}
                  className="action-icon-btn delete"
                  title="Quitar ítem"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Resumen de Totales */}
          <div style={{ background: '#10141d', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>Subtotal Compra:</span>
              <span>{formatCOP(purchaseSubtotalCalc)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
              <span>IVA (19%):</span>
              <span>{formatCOP(purchaseIvaCalc)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, color: '#D4AF37', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
              <span>Total a Pagar al Proveedor:</span>
              <span>{formatCOP(purchaseTotalCalc)}</span>
            </div>
          </div>

          <Input
            label="Notas / Número de Guía o Factura Proveedor"
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder="Ej: Factura de venta proveedor TechGlobal #49281"
          />

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingPurchase}>
              {isSubmittingPurchase ? 'Registrando...' : 'Registrar Compra y Aumentar Stock'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: NUEVO / EDITAR PROVEEDOR
         ========================================================================= */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor de Mercancía'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveSupplier} className="auth-form" noValidate>
          <div className="auth-form-grid">
            <Input
              label="NIT / RUT *"
              value={supplierFormData.nit_rut}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, nit_rut: e.target.value })}
              placeholder="Ej: 900.123.456-1"
              required
            />
            <Input
              label="Razón Social *"
              value={supplierFormData.razon_social}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, razon_social: e.target.value })}
              placeholder="Ej: TechGlobal Gaming S.A.S."
              required
            />
          </div>

          <div className="auth-form-grid">
            <Input
              label="Nombre de Contacto"
              value={supplierFormData.contacto_nombre}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, contacto_nombre: e.target.value })}
              placeholder="Ej: Mauricio Herrera"
            />
            <Input
              label="Teléfono *"
              value={supplierFormData.telefono}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, telefono: e.target.value })}
              placeholder="3101234567"
              required
            />
          </div>

          <div className="auth-form-grid">
            <Input
              label="Correo Electrónico *"
              type="email"
              value={supplierFormData.email}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
              placeholder="ventas@proveedor.com"
              required
            />
            <Input
              label="Ciudad"
              value={supplierFormData.ciudad}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, ciudad: e.target.value })}
              placeholder="Bogotá"
            />
          </div>

          <Input
            label="Dirección de Bodega / Sede"
            value={supplierFormData.direccion}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, direccion: e.target.value })}
            placeholder="Zona Franca Fontibón..."
          />

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Proveedor
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: CREAR / EDITAR PRODUCTO
         ========================================================================= */}
      <Modal
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="650px"
      >
        <form onSubmit={handleSaveProduct} className="auth-form" noValidate>
          {prodSubmitAlert && (
            <div className="form-validation-alert" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <span>Por favor completa todos los campos requeridos marcados en rojo.</span>
            </div>
          )}

          <Input
            label="Nombre del Producto *"
            value={prodFormData.nombre}
            onChange={(e) => handleProdFieldChange('nombre', e.target.value)}
            error={prodFormErrors.nombre}
            placeholder="Ej. Cyberpunk 2077: Phantom Liberty"
          />

          <div className="input-field-group">
            <label className={`input-label ${prodFormErrors.descripcion ? 'label-error' : ''}`}>
              Descripción Detallada *
            </label>
            <textarea
              className={`custom-textarea ${prodFormErrors.descripcion ? 'input-error' : ''}`}
              rows="3"
              value={prodFormData.descripcion}
              onChange={(e) => handleProdFieldChange('descripcion', e.target.value)}
              placeholder="Describe las características y especificaciones del producto..."
            ></textarea>
          </div>

          <div className="auth-form-grid">
            <Input
              label="Precio de Venta al Público (COP) *"
              type="number"
              value={prodFormData.precio}
              onChange={(e) => handleProdFieldChange('precio', e.target.value)}
              error={prodFormErrors.precio}
              placeholder="219900"
            />
            <Input
              label="Stock Inicial *"
              type="number"
              value={prodFormData.stock}
              onChange={(e) => handleProdFieldChange('stock', e.target.value)}
              error={prodFormErrors.stock}
              placeholder="10"
            />
          </div>

          <div className="auth-form-grid">
            <div className="input-field-group">
              <label className="input-label">Categoría *</label>
              <select
                value={prodFormData.categoria_id}
                onChange={(e) => handleProdFieldChange('categoria_id', parseInt(e.target.value))}
                className="custom-select"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Plataforma / Compatibilidad"
              value={prodFormData.plataforma}
              onChange={(e) => handleProdFieldChange('plataforma', e.target.value)}
              placeholder="Ej: PC, PS5, Xbox Series"
            />
          </div>

          <Input
            label="URL de la Imagen"
            value={prodFormData.imagen}
            onChange={(e) => handleProdFieldChange('imagen', e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsProdModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Guardar Cambios' : 'Ingresar Producto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: AJUSTE MANUAL DE STOCK (KARDEX)
         ========================================================================= */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Ajuste de Conteo Físico / Stock (Kardex)"
        maxWidth="480px"
      >
        {selectedStockProduct && (
          <form onSubmit={handleSaveStock} className="auth-form" noValidate>
            <div className="stock-modal-info">
              <h4>{selectedStockProduct.nombre}</h4>
              <p>Stock actual en base de datos: <strong>{selectedStockProduct.stock} unidades</strong></p>
            </div>

            <Input
              label="Nuevo Stock Físico en Bodega *"
              type="number"
              min="0"
              value={stockAmount}
              onChange={(e) => setStockAmount(e.target.value)}
              error={stockFormError}
              placeholder="0"
              required
            />

            <Input
              label="Motivo del Ajuste *"
              value={stockAdjustReason}
              onChange={(e) => setStockAdjustReason(e.target.value)}
              placeholder="Ej: Conteo físico mensual, merma, corrección..."
              required
            />

            <div className="modal-actions-bar">
              <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Actualizar y Registrar en Kardex
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* =========================================================================
          MODAL: USUARIO
         ========================================================================= */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveUser} className="auth-form" noValidate>
          <div className="auth-form-grid">
            <Input
              label="Nombre *"
              value={userFormData.nombre}
              onChange={(e) => handleUserFieldChange('nombre', e.target.value)}
              error={userFormErrors.nombre}
            />
            <Input
              label="Apellido *"
              value={userFormData.apellido}
              onChange={(e) => handleUserFieldChange('apellido', e.target.value)}
              error={userFormErrors.apellido}
            />
          </div>

          <div className="auth-form-grid">
            <div className="input-field-group">
              <label className="input-label">Tipo Doc. *</label>
              <select
                value={userFormData.tipo_documento}
                onChange={(e) => handleUserFieldChange('tipo_documento', e.target.value)}
                className="custom-select"
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="NIT">NIT / RUT</option>
              </select>
            </div>
            <Input
              label="Número Documento *"
              value={userFormData.numero_documento}
              onChange={(e) => handleUserFieldChange('numero_documento', e.target.value)}
              error={userFormErrors.numero_documento}
            />
          </div>

          <div className="auth-form-grid">
            <Input
              label="Teléfono *"
              value={userFormData.telefono}
              onChange={(e) => handleUserFieldChange('telefono', e.target.value)}
              error={userFormErrors.telefono}
            />
            <Input
              label="Correo Electrónico *"
              type="email"
              value={userFormData.email}
              onChange={(e) => handleUserFieldChange('email', e.target.value)}
              error={userFormErrors.email}
            />
          </div>

          <Input
            label="Dirección *"
            value={userFormData.direccion}
            onChange={(e) => handleUserFieldChange('direccion', e.target.value)}
            error={userFormErrors.direccion}
          />

          {!editingUser && (
            <Input
              label="Contraseña *"
              type="password"
              value={userFormData.password}
              onChange={(e) => handleUserFieldChange('password', e.target.value)}
              error={userFormErrors.password}
            />
          )}

          <div className="input-field-group">
            <label className="input-label">Rol Asignado *</label>
            <select
              value={userFormData.rol_id}
              onChange={(e) => handleUserFieldChange('rol_id', parseInt(e.target.value))}
              className="custom-select"
            >
              <option value="1">Administrador (Acceso total)</option>
              <option value="2">Empleado (Operativo)</option>
              <option value="3">Cliente (Compras y perfil)</option>
            </select>
          </div>

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: SERVICIO
         ========================================================================= */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        maxWidth="550px"
      >
        <form onSubmit={handleSaveService} className="auth-form" noValidate>
          <Input
            label="Nombre del Servicio *"
            value={serviceFormData.nombre}
            onChange={(e) => handleServiceFieldChange('nombre', e.target.value)}
            error={serviceFormErrors.nombre}
          />
          <div className="input-field-group">
            <label className="input-label">Descripción *</label>
            <textarea
              className="custom-textarea"
              rows="3"
              value={serviceFormData.descripcion}
              onChange={(e) => handleServiceFieldChange('descripcion', e.target.value)}
            />
          </div>
          <div className="auth-form-grid">
            <Input
              label="Precio (COP) *"
              type="number"
              value={serviceFormData.precio}
              onChange={(e) => handleServiceFieldChange('precio', e.target.value)}
              error={serviceFormErrors.precio}
            />
            <Input
              label="Tiempo Estimado *"
              value={serviceFormData.duracion_estimada}
              onChange={(e) => handleServiceFieldChange('duracion_estimada', e.target.value)}
              error={serviceFormErrors.duracion_estimada}
            />
          </div>
          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Servicio
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL PQR */}
      <Modal
        isOpen={isPQRModalOpen}
        onClose={() => setIsPQRModalOpen(false)}
        title={`Atención de Solicitud ${selectedPQR?.radicado || ''}`}
        maxWidth="600px"
      >
        {selectedPQR && (
          <form onSubmit={handleSavePQRResponse} className="auth-form">
            <div style={{ background: '#10141d', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 700 }}>Cliente: {selectedPQR.cliente_nombre} ({selectedPQR.cliente_email})</div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginTop: '4px' }}>Asunto: {selectedPQR.asunto}</div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>{selectedPQR.descripcion}</p>
            </div>

            <div className="input-field-group">
              <label className="input-label">Respuesta Oficial *</label>
              <textarea
                className="custom-textarea"
                rows="4"
                value={pqrResponseText}
                onChange={(e) => setPqrResponseText(e.target.value)}
                placeholder="Escribe la respuesta formal para el cliente..."
                required
              />
            </div>

            <div className="input-field-group">
              <label className="input-label">Estado de la Solicitud</label>
              <select
                value={pqrNewStatus}
                onChange={(e) => setPqrNewStatus(e.target.value)}
                className="custom-select"
              >
                <option value="Respondida">Respondida</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>

            <div className="modal-actions-bar">
              <Button type="button" variant="outline" onClick={() => setIsPQRModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmittingPQR}>
                {isSubmittingPQR ? 'Guardando...' : 'Enviar Respuesta'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* FACTURA MODAL */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
