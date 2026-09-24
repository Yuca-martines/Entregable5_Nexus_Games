import { Gamepad2, ShieldCheck, Zap, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="logo-group">
            <Gamepad2 size={28} style={{ color: '#C6A15B' }} />
            <span className="font-bold text-xl tracking-wider text-white">NEXUS GAMES</span>
          </div>
          <p className="footer-brand-text">
            Tu plataforma definitiva para la compra de videojuegos digitales. Claves 100% oficiales, entrega instantánea y soporte gamer 24/7.
          </p>
        </div>

        <div className="footer-perks">
          <div className="perk-item">
            <Zap size={22} className="text-amber-400" />
            <div>
              <h5>Entrega Instantánea</h5>
              <p>Recibe tu código digital de inmediato</p>
            </div>
          </div>
          <div className="perk-item">
            <ShieldCheck size={22} className="text-emerald-400" />
            <div>
              <h5>Licencias Oficiales</h5>
              <p>Garantía de activación directa en Steam, Epic y Consolas</p>
            </div>
          </div>
          <div className="perk-item">
            <Headphones size={22} className="text-purple-400" />
            <div>
              <h5>Soporte 24/7</h5>
              <p>Atención al jugador sin demoras</p>
            </div>
          </div>
        </div>

        <div className="footer-links-col">
          <h4>Navegación</h4>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalog">Catálogo Completo</Link></li>
            <li><Link to="/about">¿Quiénes Somos?</Link></li>
            <li><Link to="/contact">Centro de Soporte</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Nexus Games Store. Desarrollado con código limpio y componentes reciclables.</p>
      </div>
    </footer>
  );
}
