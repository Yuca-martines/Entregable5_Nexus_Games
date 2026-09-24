import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  productsAPI,
  servicesAPI,
  ordersAPI,
  invoicesAPI,
  pqrAPI,
  suppliersAPI,
  purchasesAPI,
  inventoryAPI
} from '../services/api';
import {
  Package,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Wrench,
  ShoppingBag,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Download,
  Eye,
  User,
  MessageSquare,
  Send,
  Truck,
  Boxes,
  RotateCcw,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { exportInventoryToExcel, exportInventoryToPDF } from '../utils/exportReports';
import { exportInvoiceToPDF, exportInvoicesToExcel } from '../utils/exportSalesDaily';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import DashboardSidebar from '../components/DashboardSidebar';
import InvoiceModal from '../components/InvoiceModal';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Estados de Validación de Formularios
  const [prodFormErrors, setProdFormErrors] = useState({});
  const [prodSubmitAlert, setProdSubmitAlert] = useState(false);
  const [stockFormError, setStockFormError] = useState(null);

  // Listas de Datos Seguras
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [pqrList, setPqrList] = useState([]);
  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [inventoryMovementsList, setInventoryMovementsList] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);

  // Facturas y PQR
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');

  const [pqrSearch, setPqrSearch] = useState('');
  const [pqrStatusFilter, setPqrStatusFilter] = useState('');
  const [pqrTypeFilter, setPqrTypeFilter] = useState('');
  const [selectedPQR, setSelectedPQR] = useState(null);
  const [isPQRModalOpen, setIsPQRModalOpen] = useState(false);
  const [pqrResponseText, setPqrResponseText] = useState('');
  const [pqrNewStatus, setPqrNewStatus] = useState('Respondida');
  const [isSubmittingPQR, setIsSubmittingPQR] = useState(false);

  // Filtros de Inventario, Compras y Kardex
  const [prodSearch, setProdSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [purchasesSubTab, setPurchasesSubTab] = useState('purchases');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('');
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  // Modales
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFormData, setProdFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: 10,
    categoria_id: 1,
    plataforma: 'Multiplataforma',
    imagen: '',
    destacado: 0,
    estado: 'Activo'
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState(0);
  const [stockReason, setStockReason] = useState('');

  // Modal Compra
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('Transferencia Bancaria');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { producto_id: '', cantidad: 5, precio_costo_unitario: 100000 }
  ]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const pRes = await productsAPI.getAll();
        setProductsList(pRes && pRes.success && Array.isArray(pRes.products) ? pRes.products : []);
        const cRes = await productsAPI.getCategories();
        setCategoriesList(cRes && cRes.success && Array.isArray(cRes.categories) ? cRes.categories : []);
      } catch (e) {
        console.warn('Products fallback', e);
        setProductsList([]);
      }

      try {
        const sRes = await servicesAPI.getAll();
        setServicesList(sRes && sRes.success && Array.isArray(sRes.services) ? sRes.services : []);
      } catch (e) {
        console.warn('Services fallback', e);
        setServicesList([]);
      }

      try {
        const oRes = await ordersAPI.getAllOrders();
        setOrdersList(oRes && oRes.success && Array.isArray(oRes.orders) ? oRes.orders : []);
      } catch (e) {
        console.warn('Orders fallback', e);
        setOrdersList([]);
      }

      try {
        const invRes = await invoicesAPI.getAll();
        setInvoicesList(invRes && invRes.success && Array.isArray(invRes.invoices) ? invRes.invoices : []);
      } catch (e) {
        console.warn('Invoices fallback', e);
        setInvoicesList([]);
      }

      try {
        const pqrRes = await pqrAPI.getAll();
        setPqrList(pqrRes && pqrRes.success && Array.isArray(pqrRes.pqrs) ? pqrRes.pqrs : []);
      } catch (e) {
        console.warn('PQR fallback', e);
        setPqrList([]);
      }

      try {
        const suppRes = await suppliersAPI.getAll();
        const rawSupp = suppRes?.suppliers || suppRes?.proveedores || [];
        setSuppliersList(Array.isArray(rawSupp) ? rawSupp : []);
      } catch (e) {
        console.warn('Suppliers fetch error', e);
        setSuppliersList([]);
      }

      try {
        const purchRes = await purchasesAPI.getAll();
        const rawPurch = purchRes?.purchases || purchRes?.compras || [];
        setPurchasesList(Array.isArray(rawPurch) ? rawPurch : []);
      } catch (e) {
        console.warn('Purchases fetch error', e);
        setPurchasesList([]);
      }

      try {
        const movRes = await inventoryAPI.getMovements();
        const rawMov = movRes?.movements || movRes?.movimientos || [];
        setInventoryMovementsList(Array.isArray(rawMov) ? rawMov : []);
      } catch (e) {
        console.warn('Movements fetch error', e);
        setInventoryMovementsList([]);
      }

      try {
        const sumRes = await inventoryAPI.getSummary();
        setInventorySummary(sumRes?.summary || null);
      } catch (e) {
        console.warn('Inventory summary error', e);
        setInventorySummary(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // GESTIÓN DE PRODUCTOS
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
        if (Object.keys(next).length === 0) setProdSubmitAlert(false);
        return next;
      });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!prodFormData.nombre || !prodFormData.nombre.trim()) {
      errors.nombre = 'El nombre del producto es obligatorio';
    } else if (prodFormData.nombre.trim().length < 2) {
      errors.nombre = 'Debe tener al menos 2 caracteres';
    }

    if (!prodFormData.descripcion || !prodFormData.descripcion.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }

    if (
      prodFormData.precio === '' ||
      prodFormData.precio === null ||
      isNaN(Number(prodFormData.precio)) ||
      Number(prodFormData.precio) <= 0
    ) {
      errors.precio = 'El precio es obligatorio y debe ser mayor a $0 COP';
    }

    if (
      prodFormData.stock === '' ||
      prodFormData.stock === null ||
      isNaN(Number(prodFormData.stock)) ||
      Number(prodFormData.stock) < 0
    ) {
      errors.stock = 'El stock inicial es obligatorio (0 o mayor)';
    }

    if (!prodFormData.categoria_id) {
      errors.categoria_id = 'Debes seleccionar una categoría';
    }

    if (Object.keys(errors).length > 0) {
      setProdFormErrors(errors);
      setProdSubmitAlert(true);
      showToast('Por favor completa todos los campos obligatorios resaltados en rojo.', 'error');
      return;
    }

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, prodFormData);
        showToast('Producto actualizado exitosamente.');
      } else {
        await productsAPI.create(prodFormData);
        showToast('Producto añadido al catálogo de la tienda.');
      }
      setIsProdModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al guardar producto.', 'error');
    }
  };

  const handleQuickStockDelta = async (prod, delta) => {
    try {
      const nuevo = Math.max(0, prod.stock + delta);
      await inventoryAPI.adjustStock({
        producto_id: prod.id,
        nuevo_stock: nuevo,
        motivo: delta > 0 ? 'Reabastecimiento rápido de stock' : 'Ajuste rápido por merma'
      });
      showToast(`Stock de "${prod.nombre}": ${nuevo} unidades.`);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al ajustar stock.', 'error');
    }
  };

  const handleOpenStockModal = (prod) => {
    setSelectedStockProduct(prod);
    setStockAmount(prod.stock);
    setStockReason('Ajuste de inventario físico en bodega');
    setStockFormError(null);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (stockAmount === '' || stockAmount === null || isNaN(Number(stockAmount)) || Number(stockAmount) < 0) {
      setStockFormError('La cantidad de stock debe ser un número entero mayor o igual a 0');
      showToast('Ingresa una cantidad de stock válida.', 'error');
      return;
    }

    try {
      await inventoryAPI.adjustStock({
        producto_id: selectedStockProduct.id,
        nuevo_stock: parseInt(stockAmount),
        motivo: stockReason.trim() || 'Ajuste auditado de inventario'
      });
      showToast(`Stock de ${selectedStockProduct.nombre} actualizado a ${stockAmount} unidades.`);
      setIsStockModalOpen(false);
      loadData();
    } catch (error) {
      showToast(error.message || 'Error al actualizar stock.', 'error');
    }
  };

  // -------------------------------------------------------------
  // COMPRAS Y PROVEEDORES
  // -------------------------------------------------------------
  const handleOpenPurchaseModal = () => {
    if (suppliersList.length === 0) {
      showToast('Debes tener al menos un proveedor registrado antes de registrar compras.', 'error');
      handleOpenSupplierModal();
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

  const purchaseSubtotalCalc = (purchaseItems || []).reduce(
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

    const invalid = (purchaseItems || []).some((it) => !it.producto_id || it.cantidad <= 0 || it.precio_costo_unitario < 0);
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
        showToast(`¡Compra ${res.compra?.numero_compra || ''} registrada! El inventario se incrementó.`);
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
  // TRANSICIONES DE PEDIDOS
  // -------------------------------------------------------------
  const normalizeOrderStatus = (status) => {
    const value = (status || 'Pendiente').toString().trim();
    if (value === 'En Proceso') return 'En proceso';
    if (value === 'Completado') return 'Completada';
    if (value === 'Cancelado') return 'Cancelada';
    return value;
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus, reasonText = '') => {
    try {
      const payload = {
        estado: normalizeOrderStatus(nextStatus),
        ...(normalizeOrderStatus(nextStatus) === 'Cancelada' ? { motivo_cancelacion: reasonText || 'Pedido cancelado por revisión comercial.' } : {})
      };

      const res = await ordersAPI.updateStatus(orderId, payload);
      if (res.success) {
        showToast(`Pedido #${orderId} actualizado a ${normalizeOrderStatus(nextStatus)}.`);
        loadData();
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar el pedido.', 'error');
    }
  };

  const handleOpenPQRModal = (pqr) => {
    setSelectedPQR(pqr);
    setPqrResponseText(pqr.respuesta || '');
    setPqrNewStatus(pqr.estado === 'Pendiente' ? 'En Proceso' : pqr.estado || 'Respondida');
    setIsPQRModalOpen(true);
  };

  const handleSavePQRResponse = async (e) => {
    e.preventDefault();
    if (!selectedPQR || !pqrResponseText.trim()) {
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
  // FILTRADO DE DATOS SEGURO
  // -------------------------------------------------------------
  const filteredProducts = (productsList || []).filter((p) => {
    const matchSearch =
      (p.nombre || '').toLowerCase().includes(prodSearch.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(prodSearch.toLowerCase());
    const matchCat = categoryFilter ? String(p.categoria_id) === String(categoryFilter) : true;
    return matchSearch && matchCat;
  });

  const filteredInvoices = (invoicesList || []).filter((invoice) => {
    const term = invoiceSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (invoice.numero_factura || '').toLowerCase().includes(term) ||
      (invoice.cliente_nombre || '').toLowerCase().includes(term) ||
      (invoice.cliente_documento || '').toLowerCase().includes(term);
    const matchesDate = !invoiceDateFilter ||
      new Date(invoice.fecha_emision).toISOString().split('T')[0] === invoiceDateFilter;
    return matchesSearch && matchesDate;
  });

  const filteredPqr = (pqrList || []).filter((pqr) => {
    const term = pqrSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (pqr.radicado || '').toLowerCase().includes(term) ||
      (pqr.cliente_nombre || '').toLowerCase().includes(term) ||
      (pqr.asunto || '').toLowerCase().includes(term) ||
      (pqr.descripcion || '').toLowerCase().includes(term);
    const matchesStatus = !pqrStatusFilter || (pqr.estado || '') === pqrStatusFilter;
    const matchesType = !pqrTypeFilter || (pqr.tipo || '') === pqrTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredPurchases = (purchasesList || []).filter((p) => {
    const term = purchaseSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (p.numero_compra || '').toLowerCase().includes(term) ||
      (p.proveedor_nombre || '').toLowerCase().includes(term) ||
      (p.proveedor_nit || '').toLowerCase().includes(term);
    const matchesSupplier = !purchaseSupplierFilter || String(p.proveedor_id) === String(purchaseSupplierFilter);
    return matchesSearch && matchesSupplier;
  });

  const filteredMovements = (inventoryMovementsList || []).filter((m) => {
    const term = movementSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (m.producto_nombre || '').toLowerCase().includes(term) ||
      (m.referencia_documento || '').toLowerCase().includes(term) ||
      (m.motivo || '').toLowerCase().includes(term);
    const matchesType = !movementTypeFilter || m.tipo_movimiento === movementTypeFilter;
    return matchesSearch && matchesType;
  });

  const lowStockCount = (productsList || []).filter((p) => (p.stock || 0) <= 5).length;

  const employeeNavItems = [
    { id: 'inventory', label: 'Inventario y Stock', icon: Package, badge: productsList.length },
    { id: 'purchases', label: 'Compras / Abastecimiento', icon: Truck, badge: purchasesList.length },
    { id: 'kardex', label: 'Kardex de Movimientos', icon: Boxes, badge: inventoryMovementsList.length },
    { id: 'orders', label: 'Pedidos de Clientes', icon: ShoppingBag, badge: ordersList.length },
    { id: 'invoices', label: 'Facturas', icon: FileText, badge: invoicesList.length },
    { id: 'pqr', label: 'PQR de Clientes', icon: MessageSquare, badge: pqrList.length },
    { id: 'services', label: 'Servicios Activos', icon: Wrench, badge: servicesList.length }
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'inventory':
        return 'Gestión de Inventario y Stock';
      case 'purchases':
        return 'Ingreso de Compras y Proveedores';
      case 'kardex':
        return 'Kardex / Historial de Movimientos de Bodega';
      case 'orders':
        return 'Pedidos de Clientes';
      case 'invoices':
        return 'Facturas Emitidas';
      case 'pqr':
        return 'Gestión de PQR de Clientes';
      case 'services':
        return 'Servicios Técnicos Activos';
      default:
        return 'Panel Operativo de Empleado';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR LATERAL PROFESIONAL */}
      <DashboardSidebar
        title="Panel Empleado"
        roleBadge="Empleado"
        icon={ClipboardList}
        navItems={employeeNavItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ÁREA DE TRABAJO PRINCIPAL */}
      <div className="dashboard-workspace">
        {/* TOPBAR COMPACTO Y ELEGANTE */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <div className="dashboard-breadcrumb">
              <span className="dashboard-breadcrumb-sub">OPERACIÓN DE TIENDA / {activeTab.toUpperCase()}</span>
              <h1 className="dashboard-breadcrumb-title">{getTabTitle()}</h1>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <button
              type="button"
              className="sync-db-btn"
              onClick={loadData}
              disabled={loading}
              title="Sincronizar inventario, compras y pedidos con la Base de Datos SQL"
            >
              <span className="live-db-dot"></span>
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              <span>{loading ? 'Sincronizando...' : 'Sincronizar con DB'}</span>
            </button>

            {activeTab === 'inventory' && (
              <>
                <div className="export-btn-group">
                  <button
                    type="button"
                    className="export-btn export-btn-excel"
                    onClick={() => exportInventoryToExcel(filteredProducts)}
                    title="Exportar inventario a Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    type="button"
                    className="export-btn export-btn-pdf"
                    onClick={() => exportInventoryToPDF(filteredProducts)}
                    title="Exportar inventario a PDF (.pdf)"
                  >
                    <FileText size={16} />
                    <span>Exportar PDF</span>
                  </button>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => handleOpenProdModal()}>
                  Ingresar Producto
                </Button>
              </>
            )}

            {activeTab === 'purchases' && (
              <>
                <Button variant="outline" icon={Plus} onClick={() => handleOpenSupplierModal()}>
                  Nuevo Proveedor
                </Button>
                <Button variant="primary" icon={Truck} onClick={handleOpenPurchaseModal}>
                  Ingresar Compra (Stock +)
                </Button>
              </>
            )}

            {activeTab === 'invoices' && (
              <div className="export-btn-group">
                <button
                  type="button"
                  className="export-btn export-btn-excel"
                  onClick={() => exportInvoicesToExcel(filteredInvoices)}
                  title="Exportar facturas filtradas a Excel (.xlsx)"
                >
                  <FileSpreadsheet size={16} />
                  <span>Facturas Excel</span>
                </button>
              </div>
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

          {/* Alerta de Stock Bajo */}
          {lowStockCount > 0 && activeTab === 'inventory' && (
            <div className="stock-alert-banner">
              <AlertTriangle size={24} />
              <div>
                <strong>¡Atención Reabastecimiento!</strong>
                <p>Hay {lowStockCount} producto(s) con stock crítico (&le; 5 unidades). Registra compras a proveedores para aumentar inventario de forma trazable.</p>
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA: INVENTARIO Y STOCK
             ========================================================================= */}
          {activeTab === 'inventory' && (
            <div className="tab-content">
              {inventorySummary && (
                <div className="stats-cards-grid" style={{ marginBottom: '20px' }}>
                  <div className="stat-overview-card">
                    <div className="stat-overview-header">
                      <span>Total Referencias</span>
                      <Package size={20} className="gold-icon" />
                    </div>
                    <h3>{inventorySummary.total_productos || productsList.length}</h3>
                    <p className="stat-subtext">Catálogo en sistema</p>
                  </div>
                  <div className="stat-overview-card">
                    <div className="stat-overview-header">
                      <span>Unidades en Bodega</span>
                      <Boxes size={20} className="gold-icon" />
                    </div>
                    <h3>{inventorySummary.unidades_totales || inventorySummary.total_unidades || 0}</h3>
                    <p className="stat-subtext">Stock físico acumulado</p>
                  </div>
                  <div className="stat-overview-card">
                    <div className="stat-overview-header">
                      <span>Stock Crítico (&le; 5)</span>
                      <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    </div>
                    <h3 style={{ color: (inventorySummary.productos_stock_bajo || 0) > 0 ? '#ef4444' : 'inherit' }}>
                      {inventorySummary.productos_stock_bajo || inventorySummary.cantidad_stock_critico || 0}
                    </h3>
                    <p className="stat-subtext">{inventorySummary.productos_agotados || 0} referencias agotadas</p>
                  </div>
                  <div className="stat-overview-card">
                    <div className="stat-overview-header">
                      <span>Valorización Inventario</span>
                      <DollarSign size={20} className="gold-icon" />
                    </div>
                    <h3>${Number(inventorySummary.valor_total_inventario || inventorySummary.valoracion_total_inventario || 0).toLocaleString()} COP</h3>
                    <p className="stat-subtext">A precio de venta</p>
                  </div>
                </div>
              )}

              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>

                <div className="filter-group">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Todas las Categorías</option>
                    {(categoriesList || []).map((cat) => (
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
                      <th>Precio Unitario</th>
                      <th>Stock en Bodega</th>
                      <th>Ajuste Rápido</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">No se encontraron productos.</td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <div className="product-table-cell">
                              <img src={prod.imagen} alt={prod.nombre} className="product-table-thumb" />
                              <div>
                                <strong>{prod.nombre}</strong>
                                <div className="product-meta-sub">{prod.plataforma}</div>
                              </div>
                            </div>
                          </td>
                          <td>{prod.categoria_nombre}</td>
                          <td><strong className="price-tag">${parseFloat(prod.precio || 0).toLocaleString()} COP</strong></td>
                          <td>
                            <div className="stock-cell-display">
                              <span
                                className={`stock-badge ${
                                  prod.stock === 0
                                    ? 'stock-out'
                                    : prod.stock <= 5
                                    ? 'stock-low'
                                    : 'stock-ok'
                                }`}
                              >
                                {prod.stock === 0 ? 'Agotado (0)' : `${prod.stock} disp.`}
                              </span>
                              <button
                                className="stock-edit-btn"
                                onClick={() => handleOpenStockModal(prod)}
                                title="Ajuste auditado"
                              >
                                <Sliders size={14} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="quick-stock-controls">
                              <button className="quick-stock-btn minus" onClick={() => handleQuickStockDelta(prod, -1)}>-1</button>
                              <button className="quick-stock-btn plus" onClick={() => handleQuickStockDelta(prod, 1)}>+1</button>
                            </div>
                          </td>
                          <td>
                            <button
                              className="action-icon-btn edit"
                              onClick={() => handleOpenProdModal(prod)}
                              title="Modificar producto"
                            >
                              <Edit2 size={16} />
                            </button>
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
              PESTAÑA: COMPRAS Y PROVEEDORES
             ========================================================================= */}
          {activeTab === 'purchases' && (
            <div className="tab-content">
              <div className="tabs-subnav" style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                <button
                  className={`tab-btn ${purchasesSubTab === 'purchases' ? 'active' : ''}`}
                  onClick={() => setPurchasesSubTab('purchases')}
                >
                  <Truck size={16} /> Registro de Compras ({purchasesList.length})
                </button>
                <button
                  className={`tab-btn ${purchasesSubTab === 'suppliers' ? 'active' : ''}`}
                  onClick={() => setPurchasesSubTab('suppliers')}
                >
                  <User size={16} /> Directorio de Proveedores ({suppliersList.length})
                </button>
              </div>

              {purchasesSubTab === 'purchases' ? (
                <>
                  <div className="filter-bar">
                    <div className="search-input-wrapper">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar por # compra o proveedor..."
                        value={purchaseSearch}
                        onChange={(e) => setPurchaseSearch(e.target.value)}
                        className="custom-search-input"
                      />
                    </div>
                    <div className="filter-group">
                      <select
                        value={purchaseSupplierFilter}
                        onChange={(e) => setPurchaseSupplierFilter(e.target.value)}
                        className="custom-select"
                      >
                        <option value="">Todos los proveedores</option>
                        {(suppliersList || []).map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.razon_social}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive-card">
                    <table className="custom-data-table">
                      <thead>
                        <tr>
                          <th>N° Compra</th>
                          <th>Proveedor</th>
                          <th>Fecha</th>
                          <th>Método Pago</th>
                          <th>Total Costo</th>
                          <th>Estado</th>
                          <th>Detalles</th>
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
                          filteredPurchases.map((pur) => (
                            <tr key={pur.id}>
                              <td><strong>{pur.numero_compra}</strong></td>
                              <td>
                                <strong>{pur.proveedor_nombre}</strong>
                                <div className="product-meta-sub">NIT: {pur.proveedor_nit}</div>
                              </td>
                              <td>{new Date(pur.fecha_emision || pur.fecha_hora || Date.now()).toLocaleString()}</td>
                              <td>{pur.metodo_pago}</td>
                              <td><strong className="price-tag">${parseFloat(pur.total || 0).toLocaleString()} COP</strong></td>
                              <td><Badge variant="success">{pur.estado || 'Completada'}</Badge></td>
                              <td>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  {(pur.detalles || []).map((d) => (
                                    <div key={d.id}>
                                      • {d.producto_nombre} (+{d.cantidad} un. @ ${parseFloat(d.precio_costo_unitario || 0).toLocaleString()})
                                    </div>
                                  ))}
                                </div>
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
                        <th>Correo</th>
                        <th>Ciudad</th>
                        <th>Estado</th>
                        <th>Editar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersList.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-6 text-muted">No hay proveedores registrados.</td>
                        </tr>
                      ) : (
                        suppliersList.map((sup) => (
                          <tr key={sup.id}>
                            <td><strong>{sup.nit_rut}</strong></td>
                            <td><strong>{sup.razon_social}</strong></td>
                            <td>{sup.contacto_nombre || 'N/A'}</td>
                            <td>{sup.telefono}</td>
                            <td>{sup.email}</td>
                            <td>{sup.ciudad}</td>
                            <td>
                              <Badge variant={sup.estado === 'Activo' ? 'success' : 'danger'}>
                                {sup.estado}
                              </Badge>
                            </td>
                            <td>
                              <button
                                className="action-icon-btn edit"
                                onClick={() => handleOpenSupplierModal(sup)}
                                title="Editar proveedor"
                              >
                                <Edit2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PESTAÑA: KARDEX / MOVIMIENTOS
             ========================================================================= */}
          {activeTab === 'kardex' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por producto, ref doc o motivo..."
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
                    <option value="">Todos los tipos de movimiento</option>
                    <option value="ENTRADA_COMPRA">ENTRADA_COMPRA (+)</option>
                    <option value="SALIDA_VENTA">SALIDA_VENTA (-)</option>
                    <option value="AJUSTE_MANUAL">AJUSTE_MANUAL</option>
                    <option value="ANULACION_PEDIDO">ANULACION_PEDIDO (+)</option>
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
                      <th>Cantidad</th>
                      <th>Stock Anterior</th>
                      <th>Stock Nuevo</th>
                      <th>Ref. Doc</th>
                      <th>Motivo / Auditoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-6 text-muted">
                          No hay movimientos de inventario registrados.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((mov) => {
                        const isEntrada = mov.tipo_movimiento === 'ENTRADA_COMPRA' || mov.tipo_movimiento === 'ANULACION_PEDIDO';
                        const isSalida = mov.tipo_movimiento === 'SALIDA_VENTA';

                        return (
                          <tr key={mov.id}>
                            <td>{new Date(mov.creado_en || Date.now()).toLocaleString()}</td>
                            <td><strong>{mov.producto_nombre}</strong></td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: isEntrada ? 'rgba(34, 197, 94, 0.15)' : isSalida ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                  color: isEntrada ? '#4ade80' : isSalida ? '#f87171' : '#facc15'
                                }}
                              >
                                {isEntrada && <ArrowDownRight size={14} />}
                                {isSalida && <ArrowUpRight size={14} />}
                                {!isEntrada && !isSalida && <RotateCcw size={14} />}
                                {mov.tipo_movimiento}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: isEntrada ? '#4ade80' : isSalida ? '#f87171' : '#f8fafc' }}>
                                {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                              </strong>
                            </td>
                            <td>{mov.stock_anterior}</td>
                            <td><strong>{mov.stock_nuevo}</strong></td>
                            <td><span className="gold-pill" style={{ fontSize: '11px' }}>{mov.referencia_documento || 'N/A'}</span></td>
                            <td><span style={{ fontSize: '12px', color: '#cbd5e1' }}>{mov.motivo}</span></td>
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
              PESTAÑA: PEDIDOS DE CLIENTES
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
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Factura / Venta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">No hay pedidos registrados.</td>
                      </tr>
                    ) : (
                      ordersList.map((ord) => {
                        const status = normalizeOrderStatus(ord.estado);
                        const actions = [];

                        if (status === 'Pendiente') {
                          actions.push({ label: 'Pasar a En proceso', value: 'En proceso' });
                          actions.push({ label: 'Cancelar', value: 'Cancelada', danger: true });
                        } else if (status === 'En proceso') {
                          actions.push({ label: 'Marcar Completada', value: 'Completada' });
                          actions.push({ label: 'Cancelar', value: 'Cancelada', danger: true });
                        }

                        return (
                          <tr key={ord.id}>
                            <td><strong>#ORD-{ord.id.toString().padStart(4, '0')}</strong></td>
                            <td>{ord.cliente_nombre} {ord.cliente_apellido}</td>
                            <td>{new Date(ord.creado_en || Date.now()).toLocaleDateString()}</td>
                            <td><strong className="price-tag">${parseFloat(ord.total || 0).toLocaleString()} COP</strong></td>
                            <td>
                              <Badge variant={status === 'Pendiente' ? 'warning' : status === 'En proceso' ? 'info' : status === 'Completada' ? 'success' : 'danger'}>
                                {status}
                              </Badge>
                            </td>
                            <td>
                              {ord.numero_factura ? (
                                <span className="gold-pill" style={{ fontSize: '11px' }}>{ord.numero_factura}</span>
                              ) : (
                                <span className="table-muted-text">N/A</span>
                              )}
                            </td>
                            <td>
                              <div className="table-actions compact-actions">
                                {actions.length > 0 ? actions.map((action) => (
                                  <button
                                    key={`${ord.id}-${action.value}`}
                                    type="button"
                                    className={action.danger ? 'action-icon-btn danger' : 'action-icon-btn success'}
                                    onClick={() => {
                                      if (action.value === 'Cancelada') {
                                        const reason = window.prompt('Escribe la razón de la cancelación (el stock se reincorporará automáticamente):', 'Pedido cancelado por revisión comercial.');
                                        if (reason === null) return;
                                        handleUpdateOrderStatus(ord.id, action.value, reason);
                                        return;
                                      }
                                      handleUpdateOrderStatus(ord.id, action.value);
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                )) : <span className="table-muted-text">Finalizado</span>}
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
              PESTAÑA: FACTURAS
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

                <div className="filter-group">
                  <input
                    type="date"
                    value={invoiceDateFilter}
                    onChange={(e) => setInvoiceDateFilter(e.target.value)}
                    className="custom-select"
                  />
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Número Factura</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">No hay facturas con esos filtros.</td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td><strong>{invoice.numero_factura}</strong></td>
                          <td>{invoice.cliente_nombre}</td>
                          <td>{new Date(invoice.fecha_emision || Date.now()).toLocaleString()}</td>
                          <td><strong className="price-tag">${parseFloat(invoice.total || 0).toLocaleString()} COP</strong></td>
                          <td><Badge variant="success">{invoice.estado || 'Emitida'}</Badge></td>
                          <td>
                            <div className="table-actions">
                              <button className="action-icon-btn edit" onClick={() => { setSelectedInvoice(invoice); setIsInvoiceModalOpen(true); }} title="Ver factura">
                                <Eye size={16} />
                              </button>
                              <button className="action-icon-btn download" onClick={() => exportInvoiceToPDF(invoice)} title="Descargar PDF">
                                <Download size={16} />
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
              PESTAÑA: PQR
             ========================================================================= */}
          {activeTab === 'pqr' && (
            <div className="tab-content">
              <div className="filter-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar PQR por radicado, cliente o asunto..."
                    value={pqrSearch}
                    onChange={(e) => setPqrSearch(e.target.value)}
                    className="custom-search-input"
                  />
                </div>

                <div className="filter-group">
                  <select
                    value={pqrStatusFilter}
                    onChange={(e) => setPqrStatusFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Todos los estados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Respondida">Respondida</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>

                  <select
                    value={pqrTypeFilter}
                    onChange={(e) => setPqrTypeFilter(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="Petición">Petición</option>
                    <option value="Queja">Queja</option>
                    <option value="Reclamo">Reclamo</option>
                    <option value="Sugerencia">Sugerencia</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Radicado</th>
                      <th>Tipo</th>
                      <th>Cliente</th>
                      <th>Asunto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPqr.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-muted">No hay PQR con esos filtros.</td>
                      </tr>
                    ) : (
                      filteredPqr.map((pqr) => (
                        <tr key={pqr.id}>
                          <td><strong>{pqr.radicado}</strong></td>
                          <td>{pqr.tipo}</td>
                          <td>
                            <strong>{pqr.cliente_nombre}</strong><br />
                            <small>{pqr.cliente_email}</small>
                          </td>
                          <td>{pqr.asunto}</td>
                          <td>
                            <Badge
                              variant={
                                pqr.estado === 'Respondida' || pqr.estado === 'Cerrada'
                                  ? 'success'
                                  : pqr.estado === 'En Proceso'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {pqr.estado}
                            </Badge>
                          </td>
                          <td>{new Date(pqr.fecha_radicacion || Date.now()).toLocaleString('es-CO')}</td>
                          <td>
                            <div className="table-actions">
                              <button className="action-icon-btn edit" onClick={() => handleOpenPQRModal(pqr)} title="Responder PQR">
                                <Send size={16} />
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
              PESTAÑA: SERVICIOS
             ========================================================================= */}
          {activeTab === 'services' && (
            <div className="tab-content">
              <div className="table-responsive-card">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Descripción</th>
                      <th>Precio</th>
                      <th>Duración</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-muted">No hay servicios técnicos registrados.</td>
                      </tr>
                    ) : (
                      servicesList.map((srv) => (
                        <tr key={srv.id}>
                          <td><strong>{srv.nombre}</strong></td>
                          <td>{srv.descripcion}</td>
                          <td><strong className="price-tag">${parseFloat(srv.precio || 0).toLocaleString()} COP</strong></td>
                          <td>{srv.duracion_estimada}</td>
                          <td><Badge variant={srv.estado === 'Activo' ? 'success' : 'danger'}>{srv.estado}</Badge></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Modal Ajuste Stock Auditado */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Modificar Stock de Inventario"
        maxWidth="450px"
      >
        {selectedStockProduct && (
          <form onSubmit={handleSaveStock} className="auth-form" noValidate>
            <div className="stock-modal-info">
              <h4>{selectedStockProduct.nombre}</h4>
              <p>Inventario actual registrado: {selectedStockProduct.stock} unidades</p>
            </div>

            <Input
              label="Nuevo Total de Unidades *"
              type="number"
              min="0"
              value={stockAmount}
              onChange={(e) => {
                setStockAmount(e.target.value);
                if (stockFormError) setStockFormError(null);
              }}
              error={stockFormError}
              placeholder="0"
            />

            <Input
              label="Motivo del Ajuste Auditado *"
              type="text"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              placeholder="Ej. Conteo físico, corrección merma..."
            />

            <div className="modal-actions-bar">
              <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Guardar Unidades
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Compra */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Registrar Compra / Ingreso de Mercancía"
        maxWidth="750px"
      >
        <form onSubmit={handleSavePurchase} className="auth-form" noValidate>
          <div className="auth-form-grid">
            <div className="input-field-group">
              <label className="input-label">Proveedor *</label>
              <select
                className="custom-select"
                value={purchaseSupplierId}
                onChange={(e) => setPurchaseSupplierId(e.target.value)}
                required
              >
                {(suppliersList || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.razon_social} (NIT: {s.nit_rut})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-field-group">
              <label className="input-label">Método de Pago</label>
              <select
                className="custom-select"
                value={purchasePaymentMethod}
                onChange={(e) => setPurchasePaymentMethod(e.target.value)}
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Tarjeta de Crédito Corporativa">Tarjeta de Crédito Corporativa</option>
                <option value="Efectivo / Caja">Efectivo / Caja</option>
                <option value="Crédito Proveedor 30 Días">Crédito Proveedor 30 Días</option>
              </select>
            </div>
          </div>

          <div style={{ margin: '14px 0', borderTop: '1px solid rgba(148, 163, 184, 0.2)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
                Productos para Abastecimiento
              </span>
              <Button type="button" variant="secondary" icon={Plus} onClick={handleAddPurchaseItem}>
                Añadir Renglón
              </Button>
            </div>

            {(purchaseItems || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.2fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '8px',
                  borderRadius: '6px'
                }}
              >
                <select
                  className="custom-select"
                  value={item.producto_id}
                  onChange={(e) => handlePurchaseItemChange(idx, 'producto_id', e.target.value)}
                >
                  <option value="">Selecciona producto...</option>
                  {(productsList || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="custom-search-input"
                  placeholder="Cant."
                  value={item.cantidad}
                  onChange={(e) => handlePurchaseItemChange(idx, 'cantidad', e.target.value)}
                />

                <input
                  type="number"
                  min="0"
                  className="custom-search-input"
                  placeholder="Costo Unit."
                  value={item.precio_costo_unitario}
                  onChange={(e) => handlePurchaseItemChange(idx, 'precio_costo_unitario', e.target.value)}
                />

                <button
                  type="button"
                  className="action-icon-btn danger"
                  onClick={() => handleRemovePurchaseItem(idx)}
                  title="Eliminar renglón"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '8px',
              padding: '12px',
              margin: '12px 0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
              <span>Subtotal:</span>
              <strong>${purchaseSubtotalCalc.toLocaleString()} COP</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
              <span>IVA (19%):</span>
              <strong>${purchaseIvaCalc.toLocaleString()} COP</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '15px',
                fontWeight: 800,
                color: '#D4AF37',
                marginTop: '4px',
                borderTop: '1px dashed rgba(212, 175, 55, 0.3)',
                paddingTop: '6px'
              }}
            >
              <span>TOTAL COMPRA:</span>
              <span>${purchaseTotalCalc.toLocaleString()} COP</span>
            </div>
          </div>

          <Input
            label="Notas / Referencia Factura Proveedor"
            value={purchaseNotes}
            onChange={(e) => setPurchaseNotes(e.target.value)}
            placeholder="Ej. Factura proveedor FE-9821"
          />

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingPurchase}>
              Confirmar e Incrementar Stock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Proveedor */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Registrar Proveedor'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveSupplier} className="auth-form" noValidate>
          <div className="auth-form-grid">
            <Input
              label="NIT o RUT *"
              value={supplierFormData.nit_rut}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, nit_rut: e.target.value })}
              placeholder="Ej. 901234567-8"
              required
            />
            <Input
              label="Razón Social *"
              value={supplierFormData.razon_social}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, razon_social: e.target.value })}
              placeholder="Ej. Sony Interactive Colombia S.A.S."
              required
            />
          </div>

          <div className="auth-form-grid">
            <Input
              label="Nombre de Contacto"
              value={supplierFormData.contacto_nombre}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, contacto_nombre: e.target.value })}
              placeholder="Ej. Carlos Mendoza"
            />
            <Input
              label="Teléfono *"
              value={supplierFormData.telefono}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, telefono: e.target.value })}
              placeholder="Ej. 6013344556"
              required
            />
          </div>

          <div className="auth-form-grid">
            <Input
              label="Correo Electrónico *"
              type="email"
              value={supplierFormData.email}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
              placeholder="proveedor@nexus.com"
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
            label="Dirección"
            value={supplierFormData.direccion}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, direccion: e.target.value })}
            placeholder="Calle 100 # 15-20"
          />

          <div className="modal-actions-bar">
            <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal PQR */}
      <Modal
        isOpen={isPQRModalOpen}
        onClose={() => setIsPQRModalOpen(false)}
        title={selectedPQR ? `Atención PQR ${selectedPQR.radicado}` : 'Atención PQR'}
        maxWidth="760px"
      >
        {selectedPQR && (
          <form onSubmit={handleSavePQRResponse} className="auth-form" noValidate>
            <div className="pqr-modal-shell">
              <div className="pqr-modal-header">
                <div>
                  <span className="pqr-modal-kicker">Queja / reclamo / petición</span>
                  <h4>{selectedPQR.asunto}</h4>
                </div>
                <div className="pqr-modal-badges">
                  <span className="pqr-type-badge">{selectedPQR.tipo}</span>
                  <Badge
                    variant={
                      selectedPQR.estado === 'Respondida' || selectedPQR.estado === 'Cerrada'
                        ? 'success'
                        : selectedPQR.estado === 'En Proceso'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {selectedPQR.estado}
                  </Badge>
                </div>
              </div>

              <div className="pqr-modal-grid">
                <div className="pqr-modal-card">
                  <div className="pqr-card-title">Cliente</div>
                  <div className="pqr-card-body">
                    <strong>{selectedPQR.cliente_nombre}</strong>
                    <span>{selectedPQR.cliente_email}</span>
                    <span>{selectedPQR.cliente_telefono || 'Sin teléfono'}</span>
                  </div>
                </div>

                <div className="pqr-modal-card">
                  <div className="pqr-card-title">Radicado</div>
                  <div className="pqr-card-body">
                    <strong>{selectedPQR.radicado}</strong>
                    <span>{new Date(selectedPQR.fecha_radicacion || Date.now()).toLocaleString('es-CO')}</span>
                    {selectedPQR.usuario_atencion_nombre && (
                      <span>Atendido por: {selectedPQR.usuario_atencion_nombre}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pqr-modal-card pqr-complaint-card">
                <div className="pqr-card-title">Descripción de la queja o solicitud</div>
                <p>{selectedPQR.descripcion}</p>
              </div>

              {selectedPQR.respuesta && (
                <div className="pqr-modal-card pqr-response-preview">
                  <div className="pqr-card-title">Respuesta registrada</div>
                  <p>{selectedPQR.respuesta}</p>
                </div>
              )}
            </div>

            <div className="input-field-group">
              <label className="input-label">Estado de la PQR</label>
              <select
                value={pqrNewStatus}
                onChange={(e) => setPqrNewStatus(e.target.value)}
                className="custom-select"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Respondida">Respondida</option>
                <option value="Cerrada">Cerrada</option>
              </select>
            </div>

            <div className="input-field-group">
              <label className="input-label">Respuesta al cliente *</label>
              <textarea
                className="custom-textarea"
                rows="5"
                value={pqrResponseText}
                onChange={(e) => setPqrResponseText(e.target.value)}
                placeholder="Escribe la respuesta que llegará al cliente..."
              />
            </div>

            <div className="modal-actions-bar">
              <Button type="button" variant="outline" onClick={() => setIsPQRModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingPQR}>
                Guardar respuesta
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Producto */}
      <Modal
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Ingresar Nuevo Producto'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveProduct} className="auth-form" noValidate>
          {prodSubmitAlert && (
            <div className="form-validation-alert" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <span>¡Atención! Por favor completa todos los campos obligatorios resaltados en rojo.</span>
            </div>
          )}

          <Input
            label="Nombre del Producto *"
            value={prodFormData.nombre}
            onChange={(e) => handleProdFieldChange('nombre', e.target.value)}
            error={prodFormErrors.nombre}
            placeholder="Ej. Cyberpunk 2077"
          />

          <div className="input-field-group">
            <label className={`input-label ${prodFormErrors.descripcion ? 'label-error' : ''}`}>
              Descripción del Producto *
            </label>
            <textarea
              className={`custom-textarea ${prodFormErrors.descripcion ? 'input-error' : ''}`}
              rows="3"
              value={prodFormData.descripcion}
              onChange={(e) => handleProdFieldChange('descripcion', e.target.value)}
              placeholder="Descripción del juego o artículo..."
            ></textarea>
            {prodFormErrors.descripcion && (
              <span className="input-error-msg" role="alert">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{prodFormErrors.descripcion}</span>
              </span>
            )}
          </div>

          <div className="auth-form-grid">
            <Input
              label="Precio (COP) *"
              type="number"
              value={prodFormData.precio}
              onChange={(e) => handleProdFieldChange('precio', e.target.value)}
              error={prodFormErrors.precio}
              placeholder="Ej. 189900"
            />
            <Input
              label="Stock Inicial *"
              type="number"
              min="0"
              value={prodFormData.stock}
              onChange={(e) => handleProdFieldChange('stock', e.target.value)}
              error={prodFormErrors.stock}
              placeholder="Ej. 10"
            />
          </div>

          <div className="auth-form-grid">
            <div className="input-field-group">
              <label className={`input-label ${prodFormErrors.categoria_id ? 'label-error' : ''}`}>
                Categoría *
              </label>
              <select
                value={prodFormData.categoria_id}
                onChange={(e) => handleProdFieldChange('categoria_id', parseInt(e.target.value))}
                className={`custom-select ${prodFormErrors.categoria_id ? 'input-error' : ''}`}
              >
                {(categoriesList || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {prodFormErrors.categoria_id && (
                <span className="input-error-msg" role="alert">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{prodFormErrors.categoria_id}</span>
                </span>
              )}
            </div>

            <Input
              label="Plataforma"
              value={prodFormData.plataforma}
              onChange={(e) => handleProdFieldChange('plataforma', e.target.value)}
              placeholder="Ej. PC, PS5, Xbox"
            />
          </div>

          <Input
            label="URL de la Imagen"
            value={prodFormData.imagen}
            onChange={(e) => handleProdFieldChange('imagen', e.target.value)}
            placeholder="https://..."
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
    </div>
  );
}
