import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import ProductVisual from '../components/ProductVisual';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { ordenesService } from '../services/ordenesService';
import { money } from '../utils/format';

export default function Cart() {
  const { user } = useAuth();
  const { items, itemCount, total, updateQuantity, removeItem, clearCart } = useCart();
  const [direccion, setDireccion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  async function confirmarCompra() {
    setBusy(true); setError('');
    try {
      const payload = items.map(item => ({ producto_id: item.id, cantidad: item.cantidad }));
      const preview = await ordenesService.previsualizar(payload);
      if (!preview.todo_disponible) {
        const unavailable = preview.items?.find(item => !item.disponible);
        throw new Error(unavailable ? `No hay stock suficiente de “${unavailable.nombre}”.` : 'Uno de los productos ya no está disponible.');
      }
      const result = await ordenesService.confirmar(user.id, payload, direccion.trim() || undefined);
      setOrder(result);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (order) return <main className="container page cart-confirmation">
    <p className="eyebrow">COMPRA CONFIRMADA</p>
    <h1>Tu orden ya está en camino.</h1>
    <p>Orden <strong>{order.orden_id}</strong> · Total {money(order.total)}</p>
    <div className="cart-confirmation-actions"><Link className="button" to="/perfil">Ver mis compras</Link><Link className="button secondary" to="/productos">Seguir comprando</Link></div>
  </main>;

  return <main className="container page">
    <Link className="back" to="/productos"><ArrowLeft size={17}/> Seguir comprando</Link>
    <div className="page-heading cart-heading"><div><p className="eyebrow">TU SELECCIÓN</p><h1>Carrito</h1></div><span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span></div>
    {!items.length ? <div className="notice cart-empty"><h2>Tu carrito está vacío.</h2><p>Explora el catálogo y guarda aquí los productos que quieras comprar.</p><Link className="button" to="/productos">Ver productos</Link></div> : <div className="cart-layout">
      <section className="cart-items" aria-label="Productos en el carrito">
        {items.map(item => <article className="cart-item" key={item.id}>
          <Link className="cart-item-visual" to={`/productos/${item.id}`}><ProductVisual product={item}/></Link>
          <div className="cart-item-info"><p className="eyebrow">{item.categoria}</p><Link to={`/productos/${item.id}`}><h2>{item.nombre}</h2></Link><p>{money(item.precio)} por unidad</p></div>
          <div className="cart-item-controls">
            <div className="quantity-control" aria-label={`Cantidad de ${item.nombre}`}>
              <button aria-label="Reducir cantidad" onClick={() => updateQuantity(item.id, item.cantidad - 1)} disabled={item.cantidad <= 1}><Minus size={15}/></button>
              <span>{item.cantidad}</span>
              <button aria-label="Aumentar cantidad" onClick={() => updateQuantity(item.id, item.cantidad + 1)} disabled={item.cantidad >= item.stock}><Plus size={15}/></button>
            </div>
            <strong>{money(item.precio * item.cantidad)}</strong>
            <button className="remove-item" aria-label={`Eliminar ${item.nombre}`} onClick={() => removeItem(item.id)}><Trash2 size={17}/></button>
          </div>
        </article>)}
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">RESUMEN</p><h2>Tu compra</h2>
        <div className="summary-row"><span>Productos ({itemCount})</span><span>{money(total)}</span></div>
        <div className="summary-row"><span>Envío</span><span>Por confirmar</span></div>
        <div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div>
        {user && <label className="shipping-field">Dirección de envío <input value={direccion} onChange={event => setDireccion(event.target.value)} maxLength={250} placeholder="Opcional"/></label>}
        <p className="cart-note">El precio y el stock se validarán nuevamente antes de confirmar.</p>
        {error && <p className="error" role="alert">{error}</p>}
        {user
          ? <button className="button cart-checkout" disabled={busy} onClick={confirmarCompra}>{busy ? 'Validando…' : 'Confirmar compra'}</button>
          : <Link className="button cart-checkout" to="/login" state={{ from: '/carrito' }}>Inicia sesión para comprar</Link>}
      </aside>
    </div>}
  </main>;
}
