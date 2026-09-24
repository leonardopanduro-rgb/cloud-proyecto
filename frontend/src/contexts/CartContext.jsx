import { createContext, useEffect, useMemo, useState } from 'react';

export const CartContext = createContext(null);
const CART_KEY = 'cloudshop_cart_v1';

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(item => item?.id && Number(item.cantidad) > 0) : [];
  } catch {
    return [];
  }
}

function cartProduct(product) {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: Number(product.precio),
    stock: Number(product.stock || 0),
    categoria: product.categoria || '',
    imagen_url: product.imagen_url || '',
    tipo: product.tipo || '',
    color: product.color || '',
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, cantidad = 1) {
    const amount = Math.max(1, Number(cantidad) || 1);
    setItems(current => {
      const existing = current.find(item => String(item.id) === String(product.id));
      const max = Math.max(1, Number(product.stock) || amount);
      if (existing) {
        return current.map(item => String(item.id) === String(product.id)
          ? { ...cartProduct(product), cantidad: Math.min(max, item.cantidad + amount) }
          : item);
      }
      return [...current, { ...cartProduct(product), cantidad: Math.min(max, amount) }];
    });
  }

  function updateQuantity(id, cantidad) {
    setItems(current => current.map(item => {
      if (String(item.id) !== String(id)) return item;
      return { ...item, cantidad: Math.min(Math.max(1, Number(cantidad) || 1), Math.max(1, item.stock)) };
    }));
  }

  function removeItem(id) {
    setItems(current => current.filter(item => String(item.id) !== String(id)));
  }

  function clearCart() { setItems([]); }

  const value = useMemo(() => ({
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount: items.reduce((sum, item) => sum + item.cantidad, 0),
    total: items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
