import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Store,
  UserCheck,
  LogOut,
  X,
  Menu,
  Database,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardSidebar({
  title = 'Panel Administrativo',
  roleBadge = 'Administrador',
  icon: RoleIcon,
  navItems = [],
  activeTab,
  onTabChange,
  extraStats = null
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Botón flotante móvil para abrir el menú lateral en pantallas pequeñas */}
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir panel lateral"
      >
        <Menu size={22} />
        <span>Menú Panel</span>
      </button>

      {/* Backdrop para oscurecer en móviles */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Barra Lateral Principal */}
      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Cabecera con Logo y Botón de cierre móvil */}
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-logo-link">
            <div className="sidebar-logo-icon">
              <Gamepad2 size={24} className="gold-accent" />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">NEXUS</span>
              <span className="sidebar-brand-sub">GAMES</span>
            </div>
          </Link>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Cerrar panel lateral"
          >
            <X size={20} />
          </button>
        </div>

        {/* Badge del Panel */}
        <div className="sidebar-panel-tag">
          {RoleIcon && <RoleIcon size={14} />}
          <span>{roleBadge.toUpperCase()}</span>
        </div>

        {/* Tarjeta de Perfil del Usuario */}
        <div className="sidebar-user-card">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
            alt={user?.nombre || 'Usuario'}
            className="sidebar-user-avatar"
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={`${user?.nombre} ${user?.apellido || ''}`}>
              {user?.nombre} {user?.apellido || ''}
            </span>
            <div className="sidebar-user-status">
              <span className="status-dot-pulse"></span>
              <span className="status-text">{user?.rol_nombre || roleBadge} • Activo</span>
            </div>
          </div>
        </div>

        {/* Menú de Navegación del Dashboard */}
        <div className="sidebar-scrollable-content">
          <div className="sidebar-nav-section">
            <span className="sidebar-section-title">MÓDULOS DE GESTIÓN</span>
            <nav className="sidebar-nav-list">
              {navItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <div className="sidebar-nav-btn-left">
                      {ItemIcon && <ItemIcon size={18} className="sidebar-nav-icon" />}
                      <span className="sidebar-nav-label">{item.label}</span>
                    </div>
                    <div className="sidebar-nav-btn-right">
                      {item.badge !== undefined && item.badge !== null && (
                        <span className={`sidebar-count-badge ${isActive ? 'active' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={14} className="sidebar-chevron" />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Accesos Rápidos hacia la Tienda y Perfil */}
          <div className="sidebar-nav-section">
            <span className="sidebar-section-title">ACCESOS RÁPIDOS</span>
            <nav className="sidebar-nav-list">
              <Link to="/catalog" className="sidebar-nav-btn quick-link" onClick={() => setIsMobileOpen(false)}>
                <div className="sidebar-nav-btn-left">
                  <Store size={18} className="sidebar-nav-icon text-gold" />
                  <span className="sidebar-nav-label">Ver Tienda Pública</span>
                </div>
                <ChevronRight size={14} className="sidebar-chevron" />
              </Link>
              <Link to="/client" className="sidebar-nav-btn quick-link" onClick={() => setIsMobileOpen(false)}>
                <div className="sidebar-nav-btn-left">
                  <UserCheck size={18} className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">Mi Cuenta / Perfil</span>
                </div>
                <ChevronRight size={14} className="sidebar-chevron" />
              </Link>
            </nav>
          </div>

          {/* Estadísticas Rápidas opcionales en Sidebar */}
          {extraStats && (
            <div className="sidebar-stats-widget">
              {extraStats}
            </div>
          )}
        </div>

        {/* Footer del Sidebar: Estado de Base de Datos y Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-db-status">
            <Database size={13} className="db-icon" />
            <span>DB Online: PostgreSQL / MySQL</span>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
