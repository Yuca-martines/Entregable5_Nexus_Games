import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { GAMES_DATA } from '../data/games';
import { useCart } from '../context/CartContext';
import {
  Search,
  SlidersHorizontal,
  Package,
  ShoppingCart,
  Check,
  Gamepad2,
  Monitor,
  Cpu,
  Headphones,
  AlertCircle
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function Catalog() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [addedIds, setAddedIds] = useState({});

  // Cargar productos desde el Backend
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await productsAPI.getAll();
        const catRes = await productsAPI.getCategories();

        if (res.success && res.products && res.products.length > 0) {
          setProducts(res.products);
        } else {
          // Fallback a GAMES_DATA formateado
          const fallback = GAMES_DATA.map((g) => ({
            id: g.id,
            nombre: g.title,
            descripcion: g.description,
            precio: g.price,
            stock: g.stock !== undefined ? g.stock : 12,
            categoria_id: g.category === 'hardware' ? 3 : g.category === 'peripherals' ? 4 : 1,
            categoria_nombre: g.category === 'hardware' ? 'Hardware' : g.category === 'peripherals' ? 'Accesorios' : 'Videojuegos',
            plataforma: g.platform || 'Multiplataforma',
            imagen: g.image,
            destacado: g.featured ? 1 : 0,
            estado: 'Activo'
          }));
          setProducts(fallback);
        }

        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        } else {
          setCategories([
            { id: 1, nombre: 'Videojuegos' },
            { id: 2, nombre: 'Electrodomésticos Gamers' },
            { id: 3, nombre: 'Componentes y Hardware' },
            { id: 4, nombre: 'Accesorios y Periféricos' }
          ]);
        }
      } catch {
        // Fallback
        const fallback = GAMES_DATA.map((g) => ({
          id: g.id,
          nombre: g.title,
          descripcion: g.description,
          precio: g.price,
          stock: g.stock !== undefined ? g.stock : 10,
          categoria_id: 1,
          categoria_nombre: 'Videojuegos',
          plataforma: g.platform || 'Multiplataforma',
          imagen: g.image,
          destacado: g.featured ? 1 : 0,
          estado: 'Activo'
        }));
        setProducts(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (product) => {
    if (product.stock === 0) return;

    addToCart({
      id: product.id,
      title: product.nombre,
      price: parseFloat(product.precio),
      image: product.imagen,
      platforms: product.plataforma ? [product.plataforma] : ['Multiplataforma'],
      category: product.categoria_nombre,
      stock: Number(product.stock)
    });

    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      (p.plataforma && p.plataforma.toLowerCase().includes(search.toLowerCase()));

    const matchCategory =
      selectedCategory === 'all' ||
      String(p.categoria_id) === String(selectedCategory) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase() === selectedCategory.toLowerCase());

    const matchPrice = parseFloat(p.precio) <= maxPrice;

    return matchSearch && matchCategory && matchPrice && p.estado === 'Activo';
  });

  return (
    <div className="catalog-page-container">
      {/* Header del Catálogo */}
      <div className="catalog-header">
        <div>
          <span className="badge-luxury">Tienda Oficial</span>
          <h1>Catálogo Completo de Productos</h1>
          <p>
            Encuentra los mejores títulos, hardware y periféricos con disponibilidad y stock en tiempo real.
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="catalog-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por juego, hardware, monitor o accesorio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input-field"
          />
        </div>

        {/* Categorías Rápidas */}
        <div className="category-pill-group">
          <button
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategory(String(cat.id))}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal: Cuadrícula de Productos */}
      {loading ? (
        <div className="loading-state-box">
          <div className="loading-spinner"></div>
          <p>Cargando catálogo desde la base de datos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-catalog-state">
          <AlertCircle size={48} className="gold-icon mx-auto mb-3" />
          <h3>No se encontraron productos</h3>
          <p>Intenta ajustar el término de búsqueda o selecciona otra categoría.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
            Limpiar Filtros
          </Button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const isAdded = !!addedIds[product.id];
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;

            return (
              <div key={product.id} className={`product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}>
                <div className="product-card-media">
                  <img src={product.imagen} alt={product.nombre} loading="lazy" />
                  <span className="product-platform-pill">{product.plataforma}</span>
                  {product.destacado === 1 && (
                    <span className="product-featured-badge">Destacado</span>
                  )}
                </div>

                <div className="product-card-body">
                  <span className="product-category-label">
                    {product.categoria_nombre || 'General'}
                  </span>
                  <h3 className="product-card-title">{product.nombre}</h3>
                  <p className="product-card-desc">{product.descripcion}</p>

                  <div className="product-card-footer">
                    <div>
                      <div className="product-card-price">
                        ${parseFloat(product.precio).toLocaleString()} COP
                      </div>
                      <div className="product-card-stock">
                        {isOutOfStock ? (
                          <span className="stock-label out">Agotado</span>
                        ) : isLowStock ? (
                          <span className="stock-label low">¡Últimas {product.stock} unidades!</span>
                        ) : (
                          <span className="stock-label in">{product.stock} disponibles</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={isAdded ? Check : ShoppingCart}
                      className={`btn-add-cart ${isAdded ? 'btn-added' : ''} ${isOutOfStock ? 'btn-disabled' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                    >
                      {isAdded ? '¡Agregado!' : isOutOfStock ? 'Sin Stock' : 'Comprar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}