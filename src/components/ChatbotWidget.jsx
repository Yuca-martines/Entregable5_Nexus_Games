import { useState, useEffect, useRef } from 'react';
import { chatbotAPI } from '../services/api';

// ─── Estilos inline (sin Tailwind) ────────────────────────────────────────
const S = {
  // Contenedor raíz fijo en la esquina inferior derecha
  root: {
    position: 'fixed',
    bottom: '100px',
    right: '100px',
    zIndex: 9999,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '12px',
  },

  // Botón flotante (cuando el chat está cerrado)
  toggleBtn: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    border: '2px solid rgba(251,191,36,0.5)',
    boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    color: '#0f172a',
    position: 'relative',
  },

  // Badge de notificación
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#ef4444',
    border: '2px solid #0f172a',
  },

  // Ventana del chat
  chatWindow: {
    width: '360px',
    height: '520px',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'chatSlideIn 0.2s ease-out',
  },

  // Header del chat
  header: {
    background: '#020617',
    borderBottom: '1px solid #1e293b',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: '16px',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    border: '2px solid #020617',
  },
  botName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  iaBadge: {
    background: 'rgba(245,158,11,0.15)',
    color: '#fbbf24',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(245,158,11,0.3)',
  },
  botSub: {
    color: '#64748b',
    fontSize: '11px',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    lineHeight: 1,
    transition: 'color 0.15s, background 0.15s',
  },

  // Área de mensajes
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'linear-gradient(180deg, #0f172a 0%, #080f1e 100%)',
  },

  // Burbuja de bot
  botBubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px 16px 16px 4px',
    padding: '10px 14px',
    color: '#e2e8f0',
    fontSize: '12px',
    lineHeight: '1.6',
    whiteSpace: 'pre-line',
  },

  // Burbuja de usuario
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    background: '#f59e0b',
    borderRadius: '16px 16px 4px 16px',
    padding: '10px 14px',
    color: '#0f172a',
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: '1.6',
  },

  // Chips de sugerencias
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  chip: {
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(245,158,11,0.3)',
    color: '#fcd34d',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },

  // Indicador de carga
  loading: {
    alignSelf: 'flex-start',
    background: 'rgba(30,41,59,0.7)',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '8px 14px',
    color: '#94a3b8',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Formulario de entrada
  form: {
    padding: '12px',
    background: '#020617',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#e2e8f0',
    fontSize: '12px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    background: '#f59e0b',
    border: 'none',
    borderRadius: '12px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
    transition: 'background 0.15s, opacity 0.15s',
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

// ─── Componente ────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '¡Hola, Gamer! Soy **NexusBot**, tu asesor de IA en Nexus Games. ¿En qué te puedo ayudar hoy? Puedo orientarte sobre videojuegos, hardware de PC, mantenimiento técnico o radicar una PQR.',
      suggestions: ['Ver Catálogo', 'Mantenimiento PC', '¿Cómo comprar?', 'Radicar PQR'],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(textToSend, sessionId.current);
      if (response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: response.reply,
            suggestions: response.suggestions || [],
          },
        ]);
        if (!isOpen) setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'En este momento tengo dificultades para conectar. Puedes explorar el catálogo en la barra superior o escribir a soporte@nexusgames.com.',
          suggestions: ['Ver Catálogo', 'Contacto'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Keyframe para la animación de entrada */}
      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .chatbot-close-btn:hover { color: #fff !important; background: #1e293b !important; }
        .chatbot-chip:hover { background: rgba(245,158,11,0.15) !important; border-color: rgba(245,158,11,0.6) !important; }
        .chatbot-toggle:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(245,158,11,0.55); }
        .chatbot-input:focus { border-color: #f59e0b !important; }
      `}</style>

      <div style={S.root}>
        {/* Ventana del Chat */}
        {isOpen && (
          <div style={S.chatWindow}>
            {/* Header */}
            <div style={S.header}>
              <div style={S.headerLeft}>
                <div style={S.avatar}>
                  🤖
                  <span style={S.onlineDot} />
                </div>
                <div>
                  <p style={S.botName}>
                    NexusBot
                    <span style={S.iaBadge}>✨ IA</span>
                  </p>
                  <p style={S.botSub}>Atención y Soporte Gamer 24/7</p>
                </div>
              </div>
              <button
                className="chatbot-close-btn"
                style={S.closeBtn}
                onClick={() => setIsOpen(false)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Mensajes */}
            <div style={S.messages}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={msg.sender === 'user' ? S.userBubble : S.botBubble}>
                    {msg.text.replace(/\*\*/g, '')}
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={S.chips}>
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          className="chatbot-chip"
                          style={S.chip}
                          onClick={() => handleSend(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div style={S.loading}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>✨</span>
                  NexusBot está pensando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              style={S.form}
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
              <input
                className="chatbot-input"
                style={S.input}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu consulta sobre juegos, servicios, PQR..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                style={{
                  ...S.sendBtn,
                  ...(isLoading || !inputMessage.trim() ? S.sendBtnDisabled : {}),
                }}
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* Botón flotante */}
        <button
          className="chatbot-toggle"
          style={S.toggleBtn}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Abrir asistente virtual NexusBot"
          title="¡Chatea con NexusBot IA!"
        >
          {isOpen ? '✕' : '🤖'}
          {hasUnread && !isOpen && <span style={S.badge} />}
        </button>
      </div>
    </>
  );
}
