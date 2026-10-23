import { useEffect, useState } from 'react';

const money = (n) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
async function api(path, opts = {}, tk) {
  const res = await fetch('/api' + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(tk && { Authorization: `Bearer ${tk}` }) }, body: opts.body && JSON.stringify(opts.body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function App() {
  const [cars, setCars] = useState([]); const [brand, setBrand] = useState(''); const [q, setQ] = useState('');
  const [cart, setCart] = useState([]); const [open, setOpen] = useState(null); const [panel, setPanel] = useState(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null')); const [msg, setMsg] = useState('');

  useEffect(() => { api(`/vehicles?brand=${brand}&q=${encodeURIComponent(q)}`).then(setCars).catch((e) => setMsg(e.message)); }, [brand, q]);
  const add = (v) => { setCart((c) => c.find((i) => i.id === v.id) ? c : [...c, { ...v, qty: 1 }]); setPanel('cart'); setOpen(null); };
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const saveUser = (u) => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); setPanel(cart.length ? 'cart' : null); };
  const logout = () => { localStorage.removeItem('user'); setUser(null); };

  async function checkout() {
    if (!user) return setPanel('auth');
    try {
      const r = await api('/orders', { method: 'POST', body: { items: cart.map(({ id, qty }) => ({ id, qty })) } }, user.token);
      setCart([]); setPanel(null); setMsg(`Order #${r.orderId} placed – ${money(r.total)}`);
    } catch (e) { setMsg(e.message); }
  }

  return (<>
    <header><div className="stripe" />
      <nav><b className="logo">APEX GARAGE</b>
        <input placeholder="Search model" value={q} onChange={(e) => setQ(e.target.value)} />
        <div>{user ? <button onClick={logout}>{user.name} · Log out</button> : <button onClick={() => setPanel('auth')}>Log in</button>}
          <button onClick={() => setPanel('cart')}>Cart ({cart.length})</button></div></nav></header>
    <section className="hero"><h1>Jesko Absolut.<br />And the M cars that chase it.</h1>
      <p>Hypercars from Ängelholm and performance machines from Munich, ready to order.</p>
      <div className="tabs">{['', 'Koenigsegg', 'BMW'].map((b) => <button key={b} className={brand === b ? 'on' : ''} onClick={() => setBrand(b)}>{b || 'All'}</button>)}</div></section>
    {msg && <div className="toast" onClick={() => setMsg('')}>{msg}</div>}
    <main className="grid">{cars.map((v) => (
      <article key={v.id} className="card" onClick={() => setOpen(v)}>
        <div className="art" style={{ background: `linear-gradient(135deg,#101316 40%,${v.accent})` }}><span>{v.brand}</span><h3>{v.model}</h3></div>
        <div className="info"><p>{v.tagline}</p><div className="specs"><i>{v.hp} hp</i><i>{v.top_speed_kmh} km/h</i><i>0–100 {v.zero_to_100}s</i></div>
          <div className="row"><b>{money(v.price)}</b><small>{v.stock > 0 ? `${v.stock} available` : 'Sold out'}</small></div></div></article>))}
      {!cars.length && <p>No vehicles match your search. Clear the search or switch brand.</p>}</main>

    {open && <Modal close={() => setOpen(null)}><h2>{open.brand} {open.model}</h2><p>{open.description}</p>
      <p>{open.year} · {open.hp} hp · {open.top_speed_kmh} km/h top speed · 0–100 in {open.zero_to_100}s</p><h3>{money(open.price)}</h3>
      <button className="cta" disabled={open.stock < 1} onClick={() => add(open)}>Add to cart</button></Modal>}
    {panel === 'cart' && <Modal close={() => setPanel(null)}><h2>Your cart</h2>
      {!cart.length && <p>Your cart is empty. Pick a vehicle to start.</p>}
      {cart.map((i) => <div className="row" key={i.id}><span>{i.model}</span><span>{money(i.price)}{' '}
        <button onClick={() => setCart(cart.filter((c) => c.id !== i.id))}>Remove</button></span></div>)}
      {!!cart.length && <><h3>Total {money(total)}</h3><button className="cta" onClick={checkout}>{user ? 'Place order' : 'Log in to order'}</button></>}</Modal>}
    {panel === 'auth' && <Auth done={saveUser} close={() => setPanel(null)} />}
  </>);
}

function Modal({ children, close }) {
  return <div className="overlay" onClick={close}><div className="modal" onClick={(e) => e.stopPropagation()}><button className="x" onClick={close}>Close</button>{children}</div></div>;
}
function Auth({ done, close }) {
  const [mode, setMode] = useState('login'); const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); try { const r = await api(`/auth/${mode}`, { method: 'POST', body: f }); done({ token: r.token, name: r.name }); } catch (x) { setErr(x.message); } };
  return <Modal close={close}><h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
    <form onSubmit={submit}>{mode === 'register' && <input placeholder="Full name" value={f.name} onChange={set('name')} />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} />
      <input type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} />
      {err && <p className="err">{err}</p>}<button className="cta">{mode === 'login' ? 'Log in' : 'Create account'}</button></form>
    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}</button></Modal>;
}
