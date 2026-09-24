import { Gamepad2, ShieldCheck, Zap, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="about-page">
      <h1 className="page-title">¿Quiénes Somos en Nexus Games?</h1>
      <p className="page-content">
        Somos una tienda digital líder apasionada por los videojuegos. Nuestra misión es conectar a los jugadores con sus títulos favoritos ofreciendo claves digitales 100% oficiales, precios competitivos y entrega instantánea las 24 horas del día.
      </p>

      <div className="about-features">
        <div className="feature-card">
          <Gamepad2 size={48} className="feature-icon" />
          <h3>Pasión por el Gaming</h3>
          <p>Creado por gamers para gamers. Entendemos lo importante que es tener acceso rápido y seguro a los mejores lanzamientos.</p>
        </div>
        <div className="feature-card">
          <Zap size={48} className="feature-icon" />
          <h3>Entrega Instantánea</h3>
          <p>Tu clave digital se genera e inmuniza inmediatamente al realizar la compra, lista para canjear en Steam, Epic o Consolas.</p>
        </div>
        <div className="feature-card">
          <ShieldCheck size={48} className="feature-icon" />
          <h3>Garantía de Activación</h3>
          <p>Todas nuestras licencias proceden directamente de distribuidores oficiales autorizados con soporte de activación 100% garantizado.</p>
        </div>
        <div className="feature-card">
          <Award size={48} className="feature-icon" />
          <h3>Mejores Precios del Mercado</h3>
          <p>Negociamos directamente con desarrolladores e editores para brindarte ofertas exclusivas y descuentos de hasta el 50%.</p>
        </div>
      </div>
    </div>
  );
}
