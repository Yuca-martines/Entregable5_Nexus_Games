import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, usersAPI, invoicesAPI } from '../services/api';
import {
  User,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Shield,
  FileText,
  Clock,
  Package,
  ArrowRight,
  CheckCircle,
  Save,
  Lock,
  Download,
  Eye,
  Search,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import InvoiceModal from '../components/InvoiceModal';
import { exportInvoiceToPDF } from '../utils/exportSalesDaily';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'invoices' | 'profile'
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    email: user?.email || '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getMyOrders();
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (e) {
      console.warn('Orders fetch error', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await invoicesAPI.getMyInvoices();
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch {
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadOrders();
    loadInvoices();
  }, []);

  const [errorMessage, setErrorMessage] = useState(null);

  const filteredInvoices = invoices.filter((invoice) => {
    const term = invoiceSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (invoice.numero_factura || '').toLowerCase().includes(term) ||
      (invoice.cliente_nombre || '').toLowerCase().includes(term);
    const matchesDate = !invoiceDateFilter ||
      new Date(invoice.fecha_emision).toISOString().split('T')[0] === invoiceDateFilter;
    return matchesSearch && matchesDate;
  });

  const normalizeOrderStatus = (status) => {
    if (!status) return 'Pendiente';
    const clean = String(status).trim();
    if (clean === 'En Proceso') return 'En proceso';
    if (clean === 'Completado') return 'Completada';
    if (clean === 'Cancelado') return 'Cancelada';
    return clean;
  };

  const getOrderStatusBadgeVariant = (status) => {
    const norm = normalizeOrderStatus(status);
    if (norm === 'Pendiente') return 'warning';
    if (norm === 'En proceso') return 'info';
    if (norm === 'Completada') return 'success';
    if (norm === 'Cancelada') return 'danger';
    return 'default';
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMessage(null);

    // Validación de teléfono
    if (!/^[0-9]{10}$/.test((profileData.telefono || '').trim())) {
      setErrorMessage('El teléfono debe tener exactamente 10 dígitos numéricos (Ej. 3001234567).');
      setSaving(false);
      return;
    }

    // Validación de contraseña si se proporciona
    if (profileData.password && profileData.password.trim().length > 0) {
      const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
      if (profileData.password.length < 8) {
        setErrorMessage('La nueva contraseña debe tener al menos 8 caracteres.');
        setSaving(false);
        return;
      }
      if (!specialCharRegex.test(profileData.password)) {
        setErrorMessage('La nueva contraseña debe incluir al menos un carácter especial (!@#$%&*).');
        setSaving(false);
        return;
      }
    }

    try {
      if (user?.id) {
        await usersAPI.update(user.id, profileData);
      }
      setSuccessMsg('Información de perfil actualizada exitosamente.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (error) {
      setErrorMessage(error.message || 'Error al actualizar el perfil.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="dashboard-container">
      {/* Header del Perfil */}
      <div className="client-profile-hero">
        <div className="client-hero-left">
          <div className="client-avatar-wrapper">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
              alt={user?.nombre}
              className="client-avatar-img"
            />
          </div>
          <div className="client-hero-info">
            <div className="dashboard-badge">
              <User size={14} /> Panel de Cliente VIP
            </div>
            <h1>{user?.nombre} {user?.apellido}</h1>
            <p className="client-email">{user?.email}</p>
            <div className="client-tags">
              <span className="gold-pill">Cliente Registrado</span>
              <span className="doc-tag">{user?.tipo_documento}: {user?.numero_documento}</span>
            </div>
          </div>
        </div>

        <div className="client-hero-actions">
          <button
            type="button"
            className="sync-db-btn"
            onClick={() => { loadOrders(); loadInvoices(); }}
            disabled={loading}
            title="Sincronizar pedidos y facturas con la Base de Datos SQL"
          >
            <span className="live-db-dot"></span>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Sincronizando...' : 'Sincronizar con DB'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav mt-6">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} /> Mis Compras y Pedidos ({orders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={18} /> Mis Facturas ({invoices.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} /> Mis Datos Personales
        </button>
      </div>

      {/* =========================================================================
          PESTAÑA: HISTORIAL DE PEDIDOS
         ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="tab-content">
          {orders.length === 0 ? (
            <div className="empty-orders-box">
              <ShoppingBag size={64} className="gold-icon mb-3" />
              <h3>Aún no has realizado ninguna compra</h3>
              <p>Explora nuestro catálogo de videojuegos, periféricos y hardware de alto rendimiento.</p>
              <Link to="/catalog">
                <Button variant="primary" icon={ArrowRight}>
                  Ir a la Tienda y Catálogo
                </Button>
              </Link>
            </div>
          ) : (
            <div className="orders-list-grid">
              {orders.map((order) => (
                <div key={order.id} className="order-summary-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-number-title">Pedido #{order.id}</span>
                      <div className="order-date-text">
                        <Clock size={14} /> {new Date(order.creado_en).toLocaleString()}
                      </div>
                      {order.numero_factura && (
                        <div style={{ marginTop: '4px' }}>
                          <span className="gold-pill" style={{ fontSize: '11px' }}>
                            Factura: {order.numero_factura}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Badge variant={getOrderStatusBadgeVariant(order.estado)}>
                        {normalizeOrderStatus(order.estado)}
                      </Badge>
                    </div>
                  </div>

                  <div className="order-items-container">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <Package size={18} className="gold-icon" />
                        <span className="order-item-name">{item.producto_nombre}</span>
                        <span className="order-item-qty">x{item.cantidad}</span>
                        <strong className="order-item-price">${parseFloat(item.subtotal).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-payment-method">
                      <span>Método: </span>
                      <strong>{order.metodo_pago}</strong>
                    </div>
                    <div className="order-total-price">
                      <span>Total Pagado: </span>
                      <strong className="price-gold">${parseFloat(order.total).toLocaleString()} COP</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PESTAÑA: MIS FACTURAS
         ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="tab-content">
          <div className="filter-bar" style={{ marginBottom: '18px' }}>
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

          {filteredInvoices.length === 0 ? (
            <div className="empty-orders-box">
              <FileText size={64} className="gold-icon mb-3" />
              <h3>No hay facturas con esos filtros</h3>
              <p>Cuando realices compras, aquí aparecerán tus comprobantes con PDF descargable.</p>
            </div>
          ) : (
            <div className="orders-list-grid">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="order-summary-card">
                  <div className="order-card-header">
                    <div>
                      <span className="order-number-title">{invoice.numero_factura}</span>
                      <div className="order-date-text">
                        <Clock size={14} /> {new Date(invoice.fecha_emision).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Badge variant="success">{invoice.estado || 'Emitida'}</Badge>
                    </div>
                  </div>

                  <div className="order-items-container">
                    {(invoice.detalles || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <Package size={18} className="gold-icon" />
                        <span className="order-item-name">{item.descripcion}</span>
                        <span className="order-item-qty">x{item.cantidad}</span>
                        <strong className="order-item-price">${parseFloat(item.subtotal).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div className="order-payment-method">
                      <span>Compra:</span>
                      <strong>{invoice.metodo_pago || 'Pago registrado'}</strong>
                    </div>
                    <div className="order-total-price">
                      <span>Total Factura:</span>
                      <strong className="price-gold">${parseFloat(invoice.total).toLocaleString()} COP</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="secondary" icon={Eye} onClick={() => { setSelectedInvoice(invoice); setIsInvoiceModalOpen(true); }}>
                      Ver factura
                    </Button>
                    <Button variant="primary" icon={Download} onClick={() => exportInvoiceToPDF(invoice)}>
                      Descargar PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PESTAÑA: DATOS PERSONALES
         ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          {errorMessage && (
            <div className="auth-alert auth-alert-error mb-4">
              <Shield size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success mb-4">
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="profile-edit-card">
            <form onSubmit={handleUpdateProfile} className="auth-form">
              <div className="auth-form-grid">
                <Input
                  label="Nombre (2-40 letras)"
                  value={profileData.nombre}
                  onChange={(e) => setProfileData({ ...profileData, nombre: e.target.value.slice(0, 40) })}
                  icon={User}
                  maxLength={40}
                  required
                />
                <Input
                  label="Apellido (2-40 letras)"
                  value={profileData.apellido}
                  onChange={(e) => setProfileData({ ...profileData, apellido: e.target.value.slice(0, 40) })}
                  icon={User}
                  maxLength={40}
                  required
                />
              </div>

              <div className="auth-form-grid">
                <Input
                  label="Teléfono Móvil (10 dígitos)"
                  type="tel"
                  value={profileData.telefono}
                  onChange={(e) => setProfileData({ ...profileData, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  icon={Phone}
                  maxLength={10}
                  inputMode="numeric"
                  required
                />
                <Input
                  label="Correo Electrónico"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  icon={Mail}
                  disabled
                />
              </div>

              <Input
                label="Dirección de Envío Principal (5-100 caracteres)"
                value={profileData.direccion}
                onChange={(e) => setProfileData({ ...profileData, direccion: e.target.value.slice(0, 100) })}
                icon={MapPin}
                maxLength={100}
                required
              />

              <Input
                label="Cambiar Contraseña (mínimo 8 caracteres y carácter especial)"
                type="password"
                placeholder="Ingresa nueva contraseña con símbolo (!@#$...)"
                value={profileData.password}
                onChange={(e) => setProfileData({ ...profileData, password: e.target.value.slice(0, 64) })}
                icon={Lock}
                maxLength={64}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" icon={Save} isLoading={saving}>
                  Guardar Datos de Perfil
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    <InvoiceModal
      isOpen={isInvoiceModalOpen}
      onClose={() => setIsInvoiceModalOpen(false)}
      invoice={selectedInvoice}
    />
    </>
  );
}
