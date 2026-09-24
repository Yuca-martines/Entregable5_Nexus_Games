import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import { GAMES_DATA } from '../data/games';
import {
  Gamepad2,
  Monitor,
  Cpu,
  ShieldCheck,
  Truck,
  Headphones,
  Wrench,
  ArrowRight,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function Index() {
  const featuredGames = GAMES_DATA.filter((game) => game.featured);

  return (
    <div className="home-page">
      {/* Carrusel de Lanzamientos y Juegos Destacados */}
      <section className="hero-section">
        <Carousel slides={featuredGames} />
      </section>

      {/* Sección Informativa y Propuesta de Valor */}
      <section className="store-intro-section">
        <div className="section-header text-center">
          <div className="badge-luxury mx-auto mb-3">
            <Sparkles size={16} /> Experiencia Gaming Premium
          </div>
          <h2 className="section-main-title">Bienvenido a Nexus Games</h2>
          <p className="section-subtitle">
            Somos el centro líder especializado en tecnología gamer, hardware de alto rendimiento, 
            videojuegos oficiales y servicio técnico certificado.
          </p>
        </div>

        {/* Cuadrícula de Pilares Informativos */}
        <div className="features-grid">
          {/* Tarjeta 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Gamepad2 size={36} className="feature-gold-icon" />
            </div>
            <h3>Videojuegos Oficiales</h3>
            <p>
              Títulos originales en formato digital y físico para PC, PlayStation 5, Xbox Series X/S y Nintendo Switch.
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Cpu size={36} className="feature-gold-icon" />
            </div>
            <h3>Hardware & Ensamblaje</h3>
            <p>
              Componentes de última generación: procesadores, tarjetas gráficas RTX, memorias de alta frecuencia y refrigeración líquida.
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Monitor size={36} className="feature-gold-icon" />
            </div>
            <h3>Electrodomésticos & Periféricos</h3>
            <p>
              Monitores OLED de alta tasa de refresco, sillas ergonómicas pro, teclados mecánicos y audio posicional 7.1.
            </p>
          </div>

          {/* Tarjeta 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Wrench size={36} className="feature-gold-icon" />
            </div>
            <h3>Soporte Técnico Especializado</h3>
            <p>
              Laboratorio propio para mantenimiento preventivo, limpieza ultrasónica, diagnóstico y optimización térmica de consolas y PC.
            </p>
          </div>
        </div>

        {/* Banner de Garantías y Beneficios */}
        <div className="benefits-banner">
          <div className="benefit-item">
            <ShieldCheck size={28} className="gold-accent" />
            <div>
              <strong>Garantía Oficial Directa</strong>
              <small>Respaldo total en todos nuestros componentes</small>
            </div>
          </div>

          <div className="benefit-divider"></div>

          <div className="benefit-item">
            <Truck size={28} className="gold-accent" />
            <div>
              <strong>Envíos Nacionales Seguros</strong>
              <small>Entregas rápidas con rastreo en tiempo real</small>
            </div>
          </div>

          <div className="benefit-divider"></div>

          <div className="benefit-item">
            <Zap size={28} className="gold-accent" />
            <div>
              <strong>Asesoría Personalizada</strong>
              <small>Expertos disponibles para configurar tu setup</small>
            </div>
          </div>
        </div>

        {/* Llamado a la Acción hacia el Catálogo de Venta */}
        <div className="catalog-cta-banner">
          <div className="cta-content">
            <span className="cta-tag">TIENDA EN LÍNEA</span>
            <h2>¿Listo para subir de nivel tu experiencia de juego?</h2>
            <p>
              Explora nuestro catálogo completo con filtros por categoría, búsqueda en tiempo real, 
              control de stock y las mejores ofertas del mercado.
            </p>
            <div className="cta-btn-group">
              <Link to="/catalog">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Explorar Catálogo de Productos
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" icon={Headphones}>
                  Hablar con un Asesor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
