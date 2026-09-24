import { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Hash,
  MapPin,
  Phone,
  ShieldCheck,
  X
} from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authView,
    setAuthView,
    authMessage,
    login,
    register,
    resetPassword
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    docType: 'CC',
    docNumber: '',
    address: '',
    phone: '',
    email: '',
    password: ''
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Validación de campos (en tiempo real y al enviar)
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name': {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (!nameRegex.test(value.trim())) {
          error = 'Solo letras permitidas';
        } else if (value.trim().length < 2 || value.trim().length > 40) {
          error = 'Debe tener entre 2 y 40 letras';
        }
        break;
      }
      case 'lastName': {
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (!nameRegex.test(value.trim())) {
          error = 'Solo letras permitidas';
        } else if (value.trim().length < 2 || value.trim().length > 40) {
          error = 'Debe tener entre 2 y 40 letras';
        }
        break;
      }
      case 'docNumber': {
        const docRegex = /^[0-9a-zA-Z-]+$/;
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (!docRegex.test(value.trim())) {
          error = 'Solo números y letras permitidos';
        } else if (value.length < 6 || value.length > 12) {
          error = 'Debe tener entre 6 y 12 caracteres';
        }
        break;
      }
      case 'address': {
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (value.trim().length < 5 || value.trim().length > 100) {
          error = 'Debe tener entre 5 y 100 caracteres';
        }
        break;
      }
      case 'phone': {
        const phoneRegex = /^[0-9]+$/;
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (!phoneRegex.test(value)) {
          error = 'Solo números permitidos';
        } else if (value.length !== 10) {
          error = 'Debe tener exactamente 10 dígitos (Ej. 3001234567)';
        }
        break;
      }
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || !value.trim()) {
          error = 'Por favor, rellena este campo';
        } else if (value.length > 80) {
          error = 'Máximo 80 caracteres';
        } else if (!emailRegex.test(value.trim())) {
          error = 'Formato de correo no válido';
        }
        break;
      }
      case 'password': {
        const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
        if (!value) {
          error = 'Por favor, rellena este campo';
        } else if (value.length < 8) {
          error = 'Debe tener al menos 8 caracteres';
        } else if (value.length > 64) {
          error = 'Máximo 64 caracteres';
        } else if (!specialCharRegex.test(value)) {
          error = 'Debe incluir al menos un carácter especial (ej. !@#$%&*)';
        }
        break;
      }
      default:
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [name]: error
    }));

    return error;
  };

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Filtros y límites en tiempo real
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'name' || name === 'lastName') {
      value = value.slice(0, 40);
    } else if (name === 'docNumber') {
      value = value.slice(0, 12);
    } else if (name === 'address') {
      value = value.slice(0, 100);
    } else if (name === 'email') {
      value = value.slice(0, 80);
    } else if (name === 'password') {
      value = value.slice(0, 64);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return;
    }
    setLoading(true);
    await login(formData.email, formData.password);
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    // Validar exhaustivamente todos los campos antes de enviar
    const fields = ['name', 'lastName', 'docNumber', 'address', 'phone', 'email', 'password'];
    let hasError = false;
    const errors = {};

    fields.forEach((f) => {
      const val = formData[f] || '';
      const err = validateField(f, val);
      if (err) {
        hasError = true;
        errors[f] = err;
      }
    });

    if (!acceptedTerms) {
      hasError = true;
      errors.terms = 'Por favor, acepta los términos y condiciones para continuar';
    }

    setValidationErrors(errors);

    if (hasError) return;

    setLoading(true);
    await register(formData);
    setLoading(false);
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return;
    setLoading(true);
    const ok = await resetPassword(formData.email);
    setLoading(false);
    if (ok) {
      setRecoverySuccess(true);
    }
  };

  const getModalTitle = () => {
    switch (authView) {
      case 'register':
        return 'Crear Cuenta Gamer';
      case 'recovery':
        return 'Recuperar Contraseña';
      default:
        return 'Iniciar Sesión en Nexus Games';
    }
  };

  const handleModalClose = () => {
    closeAuthModal();
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setValidationErrors({});
  };

  const switchView = (newView) => {
    setAuthView(newView);
    setRecoverySuccess(false);
    setAcceptedTerms(false);
    setShowTermsModal(false);
    setValidationErrors({});
  };

  // Verificadores de requisitos de contraseña
  const hasMinLength = (formData.password || '').length >= 8;
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password || '');

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleModalClose}
      title={getModalTitle()}
      maxWidth={authView === 'register' ? '600px' : '450px'}
    >
      {authMessage && (
        <div className={`auth-alert auth-alert-${authMessage.type}`}>
          {authMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{authMessage.text}</span>
        </div>
      )}

      {/* VISTA LOGIN */}
      {authView === 'login' && (
        <form onSubmit={handleLoginSubmit} className="auth-form">
          <Input
            label="Correo Electrónico"
            name="email"
            type="email"
            placeholder="admin@nexusgames.com / cliente@..."
            icon={Mail}
            value={formData.email}
            onChange={handleInputChange}
            error={validationErrors.email}
            maxLength={80}
            required
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={handleInputChange}
            error={validationErrors.password}
            maxLength={64}
            required
          />

          <div className="forgot-password-container">
            <button
              type="button"
              className="link-btn text-sm"
              onClick={() => switchView('recovery')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={loading} icon={KeyRound}>
            Ingresar a la Cuenta
          </Button>

          {/* Cuentas de Acceso Rápido para Demostración */}
          <div className="demo-accounts-box">
            <span className="demo-title">
              <ShieldCheck size={14} /> Cuentas de Demostración del Entregable:
            </span>
            <div className="demo-buttons-row">
              <button
                type="button"
                className="demo-pill admin"
                onClick={() => setFormData({ ...formData, email: 'admin@nexusgames.com', password: 'Admin123*' })}
              >
                Admin
              </button>
              <button
                type="button"
                className="demo-pill employee"
                onClick={() => setFormData({ ...formData, email: 'empleado@nexusgames.com', password: 'Empleado123*' })}
              >
                Empleado
              </button>
              <button
                type="button"
                className="demo-pill client"
                onClick={() => setFormData({ ...formData, email: 'cliente@nexusgames.com', password: 'Cliente123*' })}
              >
                Cliente
              </button>
            </div>
          </div>

          <div className="auth-footer-switch">
            <span>¿Aún no tienes cuenta? </span>
            <button type="button" className="link-btn font-semibold" onClick={() => switchView('register')}>
              Regístrate gratis
            </button>
          </div>
        </form>
      )}

      {/* VISTA REGISTRO */}
      {authView === 'register' && (
        <form onSubmit={handleRegisterSubmit} noValidate className="auth-form">
          <div className="auth-form-grid">
            <Input
              label="Nombre (2-40 letras)"
              name="name"
              type="text"
              placeholder="Ej. Juan"
              icon={User}
              value={formData.name}
              onChange={handleInputChange}
              error={validationErrors.name}
              minLength={2}
              maxLength={40}
              required
            />

            <Input
              label="Apellido (2-40 letras)"
              name="lastName"
              type="text"
              placeholder="Ej. Pérez"
              icon={User}
              value={formData.lastName}
              onChange={handleInputChange}
              error={validationErrors.lastName}
              minLength={2}
              maxLength={40}
              required
            />

            <div className="input-field-group">
              <label htmlFor="docType" className={`input-label ${validationErrors.docType ? 'label-error' : ''}`}>
                Tipo de Documento
              </label>
              <div className="input-wrapper">
                <FileText size={18} className={`input-icon ${validationErrors.docType ? 'icon-error' : ''}`} />
                <select
                  id="docType"
                  name="docType"
                  className={`custom-input has-icon ${validationErrors.docType ? 'input-error' : ''}`}
                  value={formData.docType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="PP">Pasaporte (PP)</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
              {validationErrors.docType && (
                <span className="input-error-msg" role="alert">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{validationErrors.docType}</span>
                </span>
              )}
            </div>

            <Input
              label="Número de Documento (6-12 dígitos)"
              name="docNumber"
              type="text"
              placeholder="Ej. 1020304050"
              icon={Hash}
              value={formData.docNumber}
              onChange={handleInputChange}
              error={validationErrors.docNumber}
              minLength={6}
              maxLength={12}
              required
            />
          </div>

          <Input
            label="Dirección de Residencia (5-100 caracteres)"
            name="address"
            type="text"
            placeholder="Ej. Calle 123 # 45-67"
            icon={MapPin}
            value={formData.address}
            onChange={handleInputChange}
            error={validationErrors.address}
            minLength={5}
            maxLength={100}
            required
          />

          <div className="auth-form-grid">
            <Input
              label="Teléfono Móvil (10 dígitos)"
              name="phone"
              type="tel"
              placeholder="Ej. 3001234567"
              icon={Phone}
              value={formData.phone}
              onChange={handleInputChange}
              error={validationErrors.phone}
              maxLength={10}
              inputMode="numeric"
              required
            />

            <Input
              label="Correo Electrónico (máx. 80)"
              name="email"
              type="email"
              placeholder="tu_email@ejemplo.com"
              icon={Mail}
              value={formData.email}
              onChange={handleInputChange}
              error={validationErrors.email}
              maxLength={80}
              required
            />
          </div>

          <div>
            <Input
              label="Contraseña (mínimo 8 caracteres y carácter especial)"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres con símbolo (!@#$...)"
              icon={Lock}
              value={formData.password}
              onChange={handleInputChange}
              error={validationErrors.password}
              minLength={8}
              maxLength={64}
              required
            />

            {/* Guía visual interactiva de requisitos de contraseña */}
            <div className="password-requirements-box">
              <span className="password-req-title">Requisitos de seguridad:</span>
              <div className="password-req-list">
                <span className={`password-req-badge ${hasMinLength ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} /> Mínimo 8 caracteres
                </span>
                <span className={`password-req-badge ${hasSpecialChar ? 'valid' : ''}`}>
                  <CheckCircle2 size={13} /> Al menos un carácter especial (!@#$%&*...)
                </span>
              </div>
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className={`terms-card-wrapper ${validationErrors.terms ? 'has-error' : ''}`}>
            <div className="terms-content-row">
              <input
                type="checkbox"
                id="termsAccepted"
                name="termsAccepted"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (e.target.checked) {
                    setValidationErrors((prev) => ({ ...prev, terms: '' }));
                  }
                }}
                className="terms-checkbox-custom"
              />
              <div className="terms-text-container">
                <label htmlFor="termsAccepted" style={{ cursor: 'pointer' }}>
                  He leído y acepto los{' '}
                </label>
                <button
                  type="button"
                  className="terms-open-btn"
                  onClick={() => setShowTermsModal(true)}
                >
                  Términos y Condiciones
                </button>
                <span> y la Política de Tratamiento de Datos de Nexus Games.</span>
              </div>
            </div>
            {validationErrors.terms && (
              <span className="input-error-msg" role="alert">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{validationErrors.terms}</span>
              </span>
            )}
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={loading} icon={User}>
            Crear Cuenta y Guardar en BD
          </Button>

          <div className="auth-footer-switch">
            <span>¿Ya eres miembro? </span>
            <button type="button" className="link-btn font-semibold" onClick={() => switchView('login')}>
              Inicia Sesión aquí
            </button>
          </div>
        </form>
      )}

      {/* VISTA RECUPERACIÓN */}
      {authView === 'recovery' && (
        <div className="recovery-container">
          {!recoverySuccess ? (
            <form onSubmit={handleRecoverySubmit} className="auth-form">
              <p className="auth-instruction-text">
                Ingresa tu correo registrado y te enviaremos las instrucciones de restablecimiento de contraseña.
              </p>

              <Input
                label="Correo Electrónico Registrado"
                name="email"
                type="email"
                placeholder="tu_email@ejemplo.com"
                icon={Mail}
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <Button type="submit" variant="primary" fullWidth isLoading={loading} icon={Mail}>
                Enviar Enlace de Recuperación
              </Button>
            </form>
          ) : (
            <div className="recovery-success-box">
              <CheckCircle2 size={48} className="gold-icon mx-auto my-3" />
              <h3>¡Solicitud Enviada!</h3>
              <p>
                Hemos enviado un correo a <strong>{formData.email}</strong> con el enlace para restablecer tu clave.
              </p>
            </div>
          )}

          <div className="auth-footer-switch mt-4">
            <button
              type="button"
              className="link-btn font-semibold flex items-center justify-center gap-1"
              onClick={() => switchView('login')}
            >
              <ArrowLeft size={16} /> Volver al Inicio de Sesión
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE TÉRMINOS Y CONDICIONES */}
      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="terms-modal-header">
              <h3 className="terms-modal-title">
                <ShieldCheck size={22} className="gold-icon" />
                Términos y Condiciones - Nexus Games
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTermsModal(false)}
                aria-label="Cerrar términos"
              >
                <X size={20} />
              </button>
            </div>

            <div className="terms-modal-body">
              <div className="terms-section">
                <h4>1. Aceptación del Servicio</h4>
                <p>
                  Al registrarse en la plataforma Nexus Games, el usuario manifiesta su conformidad plena y sin reservas con estos Términos y Condiciones de Uso.
                </p>
              </div>

              <div className="terms-section">
                <h4>2. Registro y Seguridad de la Cuenta Gamer</h4>
                <p>
                  El usuario se compromete a proporcionar información fidedigna y actualizada. La confidencialidad de las credenciales de acceso es exclusiva responsabilidad del titular de la cuenta.
                </p>
              </div>

              <div className="terms-section">
                <h4>3. Licencias Digitales y Entrega Inmediata</h4>
                <p>
                  Todas las licencias de videojuegos comercializadas en Nexus Games son legítimas y oficiales. La emisión y activación digital se realiza de forma automática tras validarse el pago en nuestra pasarela segura.
                </p>
              </div>

              <div className="terms-section">
                <h4>4. Tratamiento de Datos Personales (Ley 1581 de 2012)</h4>
                <p>
                  Nexus Games garantiza el estricto cumplimiento de las normas de protección de datos (Habeas Data). Su información de contacto, identificación y residencia solo será utilizada para la gestión de compras y facturación de la tienda.
                </p>
              </div>

              <div className="terms-section">
                <h4>5. Garantías y Soporte al Cliente</h4>
                <p>
                  Ofrecemos soporte técnico especializado 24/7 y garantía de canje exitoso para todas las órdenes emitidas en la plataforma.
                </p>
              </div>
            </div>

            <div className="terms-modal-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTermsModal(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={CheckCircle2}
                onClick={() => {
                  setAcceptedTerms(true);
                  setValidationErrors((prev) => ({ ...prev, terms: '' }));
                  setShowTermsModal(false);
                }}
              >
                Aceptar Términos y Condiciones
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
