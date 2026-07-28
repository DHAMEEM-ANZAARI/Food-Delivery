import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [items, setItems] = useState([]); // { menuItemId, name, price, quantity }

  function addItem(restId, restName, item) {
    // Prevent mixing items from multiple distinct restaurants into a single cart.
    if (restaurantId && restaurantId !== restId) {
      const confirmed = window.confirm(
        `Your cart has items from "${restaurantName}". Start a new cart for "${restName}"?`
      );
      if (!confirmed) return;
      setItems([]);
    }
    setRestaurantId(restId);
    setRestaurantName(restName);

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQuantity(menuItemId, quantity) {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)));
  }

  function clearCart() {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName('');
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ restaurantId, restaurantName, items, addItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
