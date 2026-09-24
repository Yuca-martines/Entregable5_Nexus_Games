import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexus_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'recovery'
  const [authMessage, setAuthMessage] = useState(null);

  // Cargar usuario persistente desde el token JWT
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('nexus_token');
      if (storedToken) {
        try {
          const res = await authAPI.getProfile();
          if (res && res.user) {
            setUser(res.user);
          } else {
            // Token no válido
            localStorage.removeItem('nexus_token');
            setToken(null);
            setUser(null);
          }
        } catch {
          // Si el backend no responde, intentamos recuperar usuario de respaldo en sesión
          const cachedUser = localStorage.getItem('nexus_cached_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch {
              localStorage.removeItem('nexus_token');
            }
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // INICIO DE SESIÓN
  const login = async (email, password) => {
    setAuthMessage(null);
    try {
      const res = await authAPI.login(email, password);
      if (res.success && res.token) {
        localStorage.setItem('nexus_token', res.token);
        localStorage.setItem('nexus_cached_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        setAuthMessage({ type: 'success', text: res.message || `¡Bienvenido, ${res.user.nombre}!` });
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setAuthMessage(null);
        }, 1000);
        return { success: true, user: res.user };
      }
    } catch (error) {
      // Manejo de error o fallback en caso de desconexión
      const errMsg = error.message || 'Error al autenticar.';
      setAuthMessage({ type: 'error', text: errMsg });
      return { success: false, message: errMsg };
    }
  };

  // REGISTRO DE CLIENTES
  const register = async (formData) => {
    setAuthMessage(null);
    try {
      const payload = {
        nombre: formData.name || formData.nombre,
        apellido: formData.lastName || formData.apellido,
        tipo_documento: formData.docType || formData.tipo_documento,
        numero_documento: formData.docNumber || formData.numero_documento,
        direccion: formData.address || formData.direccion,
        telefono: formData.phone || formData.telefono,
        email: formData.email,
        password: formData.password
      };

      const res = await authAPI.register(payload);
      if (res.success && res.token) {
        localStorage.setItem('nexus_token', res.token);
        localStorage.setItem('nexus_cached_user', JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        setAuthMessage({ type: 'success', text: '¡Cuenta creada y autenticada con éxito!' });
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setAuthMessage(null);
        }, 1200);
        return { success: true, user: res.user };
      }
    } catch (error) {
      const errMsg = error.message || 'Error al registrar la cuenta.';
      setAuthMessage({ type: 'error', text: errMsg });
      return { success: false, message: errMsg };
    }
  };

  // RECUPERACIÓN DE CONTRASEÑA
  const resetPassword = async (email) => {
    setAuthMessage(null);
    try {
      const res = await authAPI.recoverPassword(email);
      setAuthMessage({ type: 'info', text: res.message });
      return true;
    } catch (error) {
      setAuthMessage({ type: 'error', text: error.message || 'Error al solicitar recuperación.' });
      return false;
    }
  };

  // CERRAR SESIÓN
  const logout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_cached_user');
    setToken(null);
    setUser(null);
  };

  // Control del modal
  const openAuthModal = (view = 'login') => {
    setAuthView(view);
    setAuthMessage(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authView,
        authMessage,
        login,
        register,
        resetPassword,
        logout,
        openAuthModal,
        closeAuthModal,
        setAuthView,
        setAuthMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
