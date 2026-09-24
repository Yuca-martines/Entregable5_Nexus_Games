import { useState } from 'react';
import { Send, Headphones, Mail, HelpCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="contact-page">
      <h1 className="page-title">Soporte y Atención al Jugador</h1>
      <p className="page-content">
        ¿Tienes alguna duda con la activación de un código, problema con un pedido o consulta comercial? Escríbenos y nuestro equipo Gamer te asistirá a la brevedad.
      </p>

      <div className="contact-grid">
        <div className="contact-info-panel">
          <div className="contact-info-card">
            <Headphones size={32} className="text-purple-400 mb-2" />
            <h4>Soporte Técnico 24/7</h4>
            <p>Respuesta media en menos de 15 minutos para problemas de activación.</p>
          </div>
          <div className="contact-info-card">
            <Mail size={32} className="text-blue-400 mb-2" />
            <h4>Correo de Soporte</h4>
            <p>soporte@nexusgames.com</p>
          </div>
          <div className="contact-info-card">
            <HelpCircle size={32} className="text-emerald-400 mb-2" />
            <h4>Preguntas Frecuentes</h4>
            <p>Revisa nuestra guía de canje para Steam, PlayStation y Xbox.</p>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {sent && (
            <div className="auth-alert auth-alert-success mb-4">
              ¡Mensaje enviado con éxito! Nuestro soporte revisará tu consulta.
            </div>
          )}

          <Input
            label="Nombre Completo"
            name="name"
            placeholder="Ej. Carlos Mendoza"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Correo Electrónico"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Asunto / Nº de Pedido"
            name="subject"
            placeholder="Ej. Ayuda con clave de Elden Ring"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <div className="form-group">
            <label htmlFor="message" className="input-label">Mensaje</label>
            <textarea
              id="message"
              rows={4}
              className="custom-input"
              placeholder="Escribe tu mensaje en detalle..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            ></textarea>
          </div>

          <Button type="submit" variant="primary" fullWidth icon={Send}>
            Enviar Mensaje a Soporte
          </Button>
        </form>
      </div>
    </div>
  );
}
