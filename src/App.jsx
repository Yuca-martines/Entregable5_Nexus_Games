import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import WhatsAppButton from './components/WhatsAppButton';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';


import Index from './pages/Index';
import Catalog from './pages/Catalog';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ClientDashboard from './pages/ClientDashboard';

import './index.css';

function AppContent() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/employee');

  return (
    <div className={`app-container ${isDashboardRoute ? 'is-dashboard-route' : ''}`}>
      {!isDashboardRoute && <Header />}
      <main className={isDashboardRoute ? 'dashboard-main-wrapper' : ''}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Panel de Administrador (CRUD de Usuarios, Productos, Stock, Roles y Servicios) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Administrador']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Panel de Empleado (Gestión de Stock, Inventario y Pedidos) */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['Administrador', 'Empleado']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Panel de Cliente (Historial de Compras, Perfil y Datos Personales) */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={['Administrador', 'Empleado', 'Cliente']}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}

      {/* Modales y Widgets Flotantes */}
      <AuthModal />
      <CartDrawer />
      <WhatsAppButton />
      <ChatbotWidget />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

