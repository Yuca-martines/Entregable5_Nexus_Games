import Badge from './ui/Badge';
import Button from './ui/Button';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/formatCurrency';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { useState } from 'react';

export default function GameCard({ game }) {
  const { addToCart, cart } = useCart();
  const [addedAnim, setAddedAnim] = useState(false);

  const isInCart = cart.some((item) => item.id === game.id);

  const handleAddToCart = () => {
    addToCart(game);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  return (
    <div className="game-card">
      <div className="game-card-image-wrapper">
        <img src={game.image} alt={game.title} className="game-card-img" />
        {game.discount > 0 && (
          <Badge variant="discount" className="game-card-badge-discount">
            -{game.discount}%
          </Badge>
        )}
        <div className="game-card-platforms">
          {game.platforms.map((plat) => (
            <Badge key={plat} variant="platform">
              {plat}
            </Badge>
          ))}
        </div>
      </div>

      <div className="game-card-content">
        <div className="game-card-category-rating">
          <span className="game-card-category">{game.category}</span>
          <span className="game-card-rating">
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            {game.rating}
          </span>
        </div>

        <h3 className="game-card-title" title={game.title}>
          {game.title}
        </h3>

        <p className="game-card-desc">{game.description}</p>

        <div className="game-card-footer">
          <div className="game-card-price-group">
            {game.originalPrice > game.price && (
              <span className="game-card-old-price">{formatCOP(game.originalPrice)}</span>
            )}
            <span className="game-card-current-price">{formatCOP(game.price)}</span>
          </div>

          <Button
            variant={addedAnim || isInCart ? 'secondary' : 'primary'}
            size="sm"
            icon={addedAnim || isInCart ? Check : ShoppingCart}
            onClick={handleAddToCart}
          >
            {addedAnim ? '¡Añadido!' : isInCart ? 'En Carrito' : 'Añadir'}
          </Button>
        </div>
      </div>
    </div>
  );
}
