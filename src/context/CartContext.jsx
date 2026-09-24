import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (game) => {
    const stockLimit = Number.isFinite(Number(game.stock)) ? Number(game.stock) : Infinity;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === game.id);

      if (stockLimit <= 0) return prevCart;

      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > stockLimit) return prevCart;

        return prevCart.map((item) =>
          item.id === game.id ? { ...item, quantity: nextQty } : item
        );
      }

      return [...prevCart, { ...game, quantity: 1, stock: stockLimit }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (gameId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== gameId));
  };

  const updateQuantity = (gameId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === gameId) {
            const stockLimit = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity;
            const newQty = item.quantity + delta;

            if (newQty <= 0) return null;
            if (newQty > stockLimit) return { ...item, quantity: stockLimit };

            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        openCart,
        closeCart,
        totalItems,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}
