import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/formatCurrency';
import Button from './ui/Button';

export default function Carousel({ slides = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!slides || slides.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [slides, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="carousel-wrapper">
        <div className="carousel-empty">Cargando lanzamientos destacados...</div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Pista de diapositivas (Slide por Slide) */}
      <div className="carousel-track">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`carousel-slide ${isActive ? 'active' : ''}`}
              style={{
                opacity: isActive ? 1 : 0,
                visibility: isActive ? 'visible' : 'hidden',
                transition: 'opacity 0.6s ease-in-out, transform 0.6s ease-in-out',
                transform: isActive ? 'scale(1)' : 'scale(1.03)',
                position: 'absolute',
                inset: 0
              }}
            >
              <img
                src={slide.banner || slide.image}
                alt={slide.title}
                className="carousel-bg-image"
              />
              <div className="carousel-dark-gradient"></div>

              {/* Contenido / Información del Slide */}
              <div className="carousel-content-box">
                <div className="carousel-badge-row">
                  <span className="carousel-category-badge">
                    <Sparkles size={14} /> {slide.category || 'Destacado'}
                  </span>
                  {slide.discount > 0 && (
                    <span className="carousel-discount-badge">
                      -{slide.discount}% DE DESCUENTO
                    </span>
                  )}
                  {slide.platforms && (
                    <span className="carousel-platforms-badge">
                      {Array.isArray(slide.platforms) ? slide.platforms.join(' • ') : slide.platforms}
                    </span>
                  )}
                </div>

                <h2 className="carousel-slide-title">{slide.title}</h2>
                <p className="carousel-slide-desc">{slide.description}</p>

                <div className="carousel-footer-actions">
                  <div className="carousel-price-wrapper">
                    {slide.originalPrice > slide.price && (
                      <span className="carousel-original-price">
                        {formatCOP ? formatCOP(slide.originalPrice) : `$${slide.originalPrice.toLocaleString()}`}
                      </span>
                    )}
                    <span className="carousel-final-price">
                      {formatCOP ? formatCOP(slide.price) : `$${slide.price.toLocaleString()}`} COP
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    icon={ShoppingCart}
                    onClick={() =>
                      addToCart({
                        id: slide.id,
                        title: slide.title,
                        price: slide.price,
                        image: slide.image || slide.banner,
                        category: slide.category,
                        platform: Array.isArray(slide.platforms) ? slide.platforms[0] : slide.platforms
                      })
                    }
                  >
                    Comprar Ahora
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flechas de Navegación Izquierda / Derecha */}
      <button
        className="carousel-nav-arrow prev"
        onClick={goToPrevious}
        aria-label="Diapositiva anterior"
      >
        <ChevronLeft size={30} />
      </button>

      <button
        className="carousel-nav-arrow next"
        onClick={goToNext}
        aria-label="Siguiente diapositiva"
      >
        <ChevronRight size={30} />
      </button>

      {/* Indicadores / Puntos Inferiores */}
      <div className="carousel-dots-nav">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
