import { useState } from 'react';
import { X } from 'lucide-react';

/* SVG oficial de WhatsApp */
function WhatsAppIcon({ size = 32 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 175.216 175.552"
      width={size}
      height={size}
      className="whatsapp-svg-icon"
    >
      <defs>
        <linearGradient id="wa-grad" x1="85.915" y1="175.552" x2="85.915" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#20b038" />
          <stop offset="1" stopColor="#60d66a" />
        </linearGradient>
      </defs>
      <path
        fill="url(#wa-grad)"
        d="M87.184 0C38.935 0 0 38.654 0 86.554c0 16.23 4.474 31.424 12.27 44.414L0 175.552l46.545-12.186A87.18 87.18 0 0 0 87.184 173.1c48.249 0 88.032-38.654 88.032-86.546C175.216 38.654 135.433 0 87.184 0z"
      />
      <path
        fill="#fff"
        d="M126.66 103.184c-2.14-1.07-12.637-6.238-14.6-6.95-1.96-.712-3.388-1.07-4.814 1.07-1.426 2.14-5.527 6.95-6.776 8.378-1.248 1.426-2.497 1.605-4.636.535-2.14-1.07-9.03-3.328-17.2-10.613-6.357-5.67-10.648-12.67-11.896-14.81-1.248-2.14-.133-3.296 .938-4.36.96-.957 2.14-2.497 3.21-3.745 1.07-1.248 1.426-2.14 2.14-3.567.713-1.426.356-2.675-.178-3.745-.535-1.07-4.814-11.604-6.6-15.893-1.737-4.174-3.503-3.61-4.814-3.676-1.248-.06-2.675-.072-4.103-.072-1.426 0-3.745.535-5.706 2.675-1.96 2.14-7.488 7.31-7.488 17.834 0 10.524 7.666 20.692 8.736 22.118 1.07 1.426 15.085 23.02 36.55 32.28 5.105 2.202 9.09 3.517 12.2 4.503 5.126 1.628 9.793 1.398 13.48 .848 4.112-.613 12.637-5.17 14.42-10.16 1.783-4.992 1.783-9.273 1.248-10.163-.535-.892-1.96-1.426-4.103-2.497z"
      />
    </svg>
  );
}

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);
  const phoneNumber = '573001234567';
  const defaultMessage = encodeURIComponent('¡Hola Nexus Games! Deseo recibir asesoría sobre productos, stock o servicios técnicos.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <div className="whatsapp-floating-container" id="whatsapp-floating-widget">
      {/* Tooltip informativo flotante */}
      {showTooltip && (
        <div className="whatsapp-tooltip-card">
          <button 
            className="whatsapp-tooltip-close" 
            onClick={() => setShowTooltip(false)}
            aria-label="Cerrar mensaje"
          >
            <X size={14} />
          </button>
          <div className="whatsapp-tooltip-header">
            <span className="whatsapp-status-dot"></span>
            <strong>Asesor Gamer en Línea</strong>
          </div>
          <p className="whatsapp-tooltip-text">
            ¿Tienes dudas sobre stock o compatibilidad de hardware? ¡Escríbenos por WhatsApp!
          </p>
        </div>
      )}

      {/* Botón flotante principal con animación */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-floating-btn"
        aria-label="Contactar por WhatsApp a Nexus Games"
        title="Chatear con un asesor por WhatsApp"
      >
        <div className="whatsapp-icon-wrapper">
          <WhatsAppIcon size={32} />
        </div>
        <span className="whatsapp-pulse-ring"></span>
      </a>
    </div>
  );
}
