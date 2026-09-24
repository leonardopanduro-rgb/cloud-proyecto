import { NavLink, Link } from 'react-router-dom';
import { ArrowUpRight, UserRound, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  return <><div className="topline"><div className="container">Tecnología que va contigo.<span>CloudShop / Perú</span></div></div><header><div className="container nav"><Link className="brand" to="/" aria-label="CloudShop, inicio">cloudshop<span>↗</span></Link><nav aria-label="Navegación principal"><NavLink to="/productos">Productos</NavLink><NavLink className="cart-nav" to="/carrito"><ShoppingBag size={17}/><span>Carrito</span>{itemCount > 0 && <b aria-label={`${itemCount} productos en el carrito`}>{itemCount}</b>}</NavLink>{isAdmin && <NavLink to="/admin"><ShieldCheck size={17}/><span>Admin</span></NavLink>}<NavLink to={user ? '/perfil' : '/login'}><UserRound size={17}/><span>{user ? 'Mi cuenta' : 'Iniciar sesión'}</span><ArrowUpRight size={14}/></NavLink></nav></div></header></>;
}
