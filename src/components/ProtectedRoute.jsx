import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Button from './ui/Button';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="access-denied-container">
        <ShieldAlert size={64} className="gold-icon" />
        <h2>Autenticación Requerida</h2>
        <p>Debes iniciar sesión para acceder a este panel de administración.</p>
        <Button variant="primary" onClick={() => openAuthModal('login')}>
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  if (allowedRoles.length > 0) {
    const userRole = (user.rol_nombre || '').toLowerCase();
    const hasPermission = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!hasPermission) {
      return (
        <div className="access-denied-container">
          <ShieldAlert size={64} style={{ color: '#ef4444' }} />
          <h2>Acceso Restringido</h2>
          <p>Tu rol actual (<strong>{user.rol_nombre}</strong>) no cuenta con los privilegios necesarios para ver este módulo.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Regresar
          </Button>
        </div>
      );
    }
  }

  return children;
}
