import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Gamepad2,
  ShoppingBag,
  User,
  LogOut,
  ChevronDown,
  PanelRightOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from './ui/Button';

export default function Header() {
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userRole = (user?.rol_nombre || '').toLowerCase();
  const panelPath =
    userRole === 'administrador' ? '/admin' :
    userRole === 'empleado' ? '/employee' :
    '/client';

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="header">
      <Link to="/" className="logo">
        <div className="logo-icon-box">
          <Gamepad2 size={28} className="logo-icon gold-accent" />
        </div>
        <div className="logo-text-group">
          <span className="logo-title">NEXUS</span>
          <span className="logo-subtitle">GAMES</span>
        </div>
      </Link>

      <nav>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/catalog" className={location.pathname === '/catalog' ? 'active' : ''}>
              Venta de Productos & Catálogo
            </Link>
          </li>
          <li>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
              ¿Quiénes Somos?
            </Link>
          </li>
          <li>
            <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
              Contacto & Soporte
            </Link>
          </li>
        </ul>
      </nav>

      <div className="header-actions">
        <button className="cart-trigger-btn" onClick={openCart} aria-label="Ver Carrito de Compras">
          <ShoppingBag size={22} className="gold-accent" />
          {totalItems > 0 && <span className="cart-badge-count">{totalItems}</span>}
        </button>

        {isAuthenticated ? (
          <div className="user-profile-menu-wrapper">
            <button
              type="button"
              className="user-profile-menu"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              aria-expanded={isUserMenuOpen}
              aria-label="Abrir menú de perfil"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                alt={user?.nombre}
                className="user-avatar"
              />
              <div className="user-text-meta">
                <span className="user-name">{user?.nombre}</span>
                <span className="user-role-label">{user?.rol_nombre || 'Cliente'}</span>
              </div>
              <ChevronDown size={15} className={`user-menu-caret ${isUserMenuOpen ? 'open' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <Link to={panelPath} className="user-dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                  <PanelRightOpen size={15} />
                  <span>Ver tu panel</span>
                </Link>
                <button
                  type="button"
                  className="user-dropdown-item danger"
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                >
                  <LogOut size={15} />
                  <span>Cerrar cuenta</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={User}
            onClick={() => openAuthModal('login')}
          >
            Iniciar Sesión
          </Button>
        )}
      </div>
    </header>
  );
}
