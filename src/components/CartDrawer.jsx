import Button from './ui/Button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { salesAPI, ordersAPI } from '../services/api';
import { exportInvoiceToPDF } from '../utils/exportSalesDaily';
import { formatCOP } from '../utils/formatCurrency';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, Sparkles, Download, ChevronRight, CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Métodos de pago disponibles
const PAYMENT_METHODS = [
  { id: 'pse',      label: 'PSE — Débito Bancario',          icon: '🏦', desc: 'Pago directo desde tu cuenta bancaria' },
  { id: 'card',     label: 'Tarjeta de Crédito',             icon: '💳', desc: 'Visa, Mastercard, Amex' },
  { id: 'efecty',   label: 'Efecty / Pago en efectivo',      icon: '💵', desc: 'Paga en puntos autorizados' },
  { id: 'nequi',    label: 'Nequi',                          icon: '📱', desc: 'Pago rápido con tu celular' },
  { id: 'daviplata',label: 'Daviplata',                       icon: '📲', desc: 'Pago desde Daviplata' },
];

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  // step: 'cart' | 'payment' | 'success'
  const [step, setStep]                   = useState('cart');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [saleError, setSaleError]         = useState(null);

  useEffect(() => {
    if (!isCartOpen) return;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Reiniciar al cerrar
  const handleClose = () => {
    setStep('cart');
    setSelectedPayment(null);
    setSaleError(null);
    closeCart();
  };

  // Ir al paso de pago
  const handleGoToPayment = () => {
    setSaleError(null);
    setStep('payment');
  };

  // Confirmar compra
  const handleCheckout = async () => {
    if (!selectedPayment) return;

    const invalidItem = cart.find((item) => Number(item.quantity) > Number(item.stock ?? item.quantity));
    if (invalidItem) {
      setSaleError(`No puedes comprar más de ${invalidItem.stock ?? invalidItem.quantity} unidades de "${invalidItem.title}".`);
      return;
    }

    setIsProcessing(true);
    setSaleError(null);

    const orderPayload = {
      items: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        precio: item.price,
        price: item.price,
        title: item.title
      })),
      total: Number(totalPrice),
      metodo_pago: metodoPago,
      direccion_envio: user?.direccion || 'Entrega digital / Dirección registrada',
      estado: 'Pendiente',
      notas: 'Pedido efectuado desde carrito web Nexus Games'
    };

    try {
      const res = await ordersAPI.create(orderPayload);
      if (res.success) {
        setCreatedInvoice(res.factura || {
          numero_factura: `FACT-${new Date().getFullYear()}-${res.orderId || '00001'}`,
          cliente_nombre: user ? `${user.nombre} ${user.apellido}` : 'Cliente General',
          total: Number(totalPrice) * 1.19
        });
        setStep('success');
        clearCart();
      }
    } catch (err) {
      console.error('Error en checkout:', err);
      setSaleError(err.message || 'Error al procesar la compra en el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setStep('cart');
    setSelectedPayment(null);
    setCreatedInvoice(null);
    closeCart();
  };

  // ─── Títulos del modal por paso ───────────────────────────────────────────
  const modalTitle =
    step === 'payment' ? 'Selecciona tu Método de Pago' :
    step === 'success' ? '¡Compra Exitosa!' :
    'Tu Carrito Gamer';

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={handleClose} aria-modal="true" role="dialog">
      <div className="cart-drawer-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h2 className="modal-title">{modalTitle}</h2>
          <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Cerrar carrito">
            <X size={20} />
          </button>
        </div>

        {/* ── PASO 1: CARRITO ── */}
        {step === 'cart' && (
          <>
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <ShoppingBag size={56} className="text-slate-500 mx-auto mb-3" />
                <p className="font-semibold text-lg">Tu carrito está vacío</p>
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  Explora nuestro catálogo de videojuegos y aprovecha las mejores ofertas.
                </p>
                <Button variant="primary" onClick={closeCart}>Explorar Tienda</Button>
              </div>
            ) : (
              <div className="cart-content">
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.title} className="cart-item-img" />
                      <div className="cart-item-info">
                        <h4 className="cart-item-title">{item.title}</h4>
                        <div className="cart-item-platforms">
                          {Array.isArray(item.platforms) ? item.platforms.join(' • ') : (item.platforms || 'Multiplataforma')}
                        </div>
                        <span className="cart-item-price">{formatCOP(item.price)} COP</span>
                      </div>
                      <div className="cart-item-controls">
                        <div className="qty-picker">
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)} aria-label="Disminuir">
                            <Minus size={14} />
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label="Aumentar"
                            disabled={Number(item.quantity) >= Number(item.stock ?? item.quantity)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal:</span>
                    <span>{formatCOP(totalPrice)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Entrega Digital (Email / Clave):</span>
                    <span className="text-emerald-400 font-semibold">GRATIS</span>
                  </div>
                  <div className="cart-summary-row total-row">
                    <span>Total a Pagar:</span>
                    <span className="total-price-tag">{formatCOP(totalPrice)} COP</span>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    icon={CreditCard}
                    onClick={handleGoToPayment}
                  >
                    Continuar al Pago ({formatCOP(totalPrice)})
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PASO 2: SELECCIÓN DE MÉTODO DE PAGO ── */}
        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Total a pagar</span>
              <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '20px' }}>
                {formatCOP(totalPrice)} COP
              </span>
            </div>

            <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px 2px' }}>
              Elige cómo quieres pagar:
            </p>
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: selectedPayment === method.id
                    ? '2px solid #f59e0b'
                    : '2px solid #1e293b',
                  background: selectedPayment === method.id
                    ? 'rgba(245,158,11,0.10)'
                    : '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{method.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '14px' }}>{method.label}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{method.desc}</div>
                </div>
                {selectedPayment === method.id && (
                  <CheckCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                )}
              </button>
            ))}

            {saleError && (
              <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center' }}>{saleError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setStep('cart')}
                style={{
                  flex: '0 0 auto',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                ← Volver
              </button>
              <Button
                variant="primary"
                fullWidth
                size="lg"
                icon={CreditCard}
                isLoading={isProcessing}
                onClick={handleCheckout}
                disabled={!selectedPayment || isProcessing}
              >
                {selectedPayment
                  ? `Pagar con ${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.icon} ${PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label.split('—')[0].trim()}`
                  : 'Selecciona un método'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="cart-checkout-success text-center py-6">
            <Sparkles size={54} className="text-amber-400 mx-auto mb-3 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-1">¡Compra y Factura Registradas!</h3>
            <p className="text-sm text-slate-300">
              Tu pedido se ha procesado exitosamente y tus licencias digitales están listas.
            </p>
            {createdInvoice && (
              <div className="bg-slate-800/80 rounded-xl p-4 my-4 border border-amber-500/30 text-left">
                <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Factura Oficial</div>
                <div className="text-base font-bold text-white font-mono">{createdInvoice.numero_factura}</div>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes descargar tu comprobante o consultarlo en tu panel de cliente.
                </p>
                <div className="mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={() => exportInvoiceToPDF(createdInvoice)}
                  >
                    Descargar Factura PDF
                  </Button>
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={handleFinish} className="mt-2">
              Continuar Explorando
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}