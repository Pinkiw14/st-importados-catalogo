import { useState, useMemo, useEffect, useRef } from "react";

const WHATSAPP_NUMBER = "542975168695";
const SHOWROOM = "España 675";
const INSTAGRAM = "@st.importados__";

const BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQP0IiM2FPHjdL1SG0mv-LwnlhMaZLNicV9XSRLneZJqYJYPAvMCYsSKOSSH3tlKQetjY36ACz-TLfJ/pub?single=true&output=csv";

const SHEET_TABS = [
  { nombre: "JBL",           gid: "0",           tieneCasio: false },
  { nombre: "CELULARES",     gid: "401435989",   tieneCasio: false },
  { nombre: "RELOJ SMART",   gid: "71516678",    tieneCasio: false },
  { nombre: "CASIO",         gid: "1021956832",  tieneCasio: true  },
  { nombre: "APPLE",         gid: "81224994",    tieneCasio: false },
  { nombre: "XIAOMI",        gid: "1451776874",  tieneCasio: false },
  { nombre: "VAPER",         gid: "465325186",   tieneCasio: false },
  { nombre: "OTROS",         gid: "581617004",   tieneCasio: false },
];

const CATEGORY_ICONS = {
  TODOS: "◈", JBL: "🎧", CELULARES: "📱", "RELOJ SMART": "⌚",
  CASIO: "⌚", APPLE: "🍎", XIAOMI: "⚡", VAPER: "💨", OTROS: "✦",
};

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const parsePrice = (str) => {
  if (!str) return 0;
  return parseFloat(str.replace(/[$\s.]/g, "").replace(",", ".")) || 0;
};

const getStockStatus = (cantidad) => {
  if (cantidad === 0) return { label: "Sin stock", color: "#FF3B30", dot: "#FF3B30" };
  if (cantidad <= 2)  return { label: `Stock: ${cantidad}`, color: "#FFD600", dot: "#FFD600" };
  return { label: `Stock: ${cantidad}`, color: "#36ECDF", dot: "#4CAF50" };
};

const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    values.push(cur.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").replace(/^"|"$/g, ""); });
    return row;
  });
};

const STLogo = ({ size = 40, color = "#36ECDF" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <ellipse cx="28" cy="35" rx="14" ry="10" fill={color} transform="rotate(-35 28 35)" />
    <ellipse cx="22" cy="58" rx="14" ry="10" fill={color} transform="rotate(-35 22 58)" />
    <rect x="52" y="20" width="32" height="14" rx="7" fill={color} />
    <rect x="60" y="30" width="14" height="42" rx="6" fill={color} />
    <rect x="66" y="60" width="10" height="10" rx="3" fill={color} transform="rotate(45 71 65)" />
    <rect x="42" y="56" width="8" height="8" rx="2" fill={color} />
  </svg>
);

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy: #01203F; --navy-light: #0a2d52;
    --cyan: #36ECDF; --magenta: #FF12D4;
    --white: #F0F8FF; --gray: #8BA5C0;
    --surface: rgba(2,31,61,0.7); --border: rgba(54,236,223,0.15);
  }
  body { background: var(--navy); color: var(--white); font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }
  .app { min-height: 100vh; }

  .navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 14px 28px; background: rgba(1,32,63,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
  .navbar-brand { display: flex; align-items: center; gap: 12px; }
  .navbar-title { font-family: 'Oxanium', sans-serif; font-size: 18px; font-weight: 700; color: var(--cyan); letter-spacing: 2px; text-transform: uppercase; }
  .cart-btn { position: relative; background: var(--navy-light); border: 1px solid var(--border); color: var(--white); padding: 10px 18px; border-radius: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
  .cart-btn:hover { border-color: var(--cyan); color: var(--cyan); }
  .cart-badge { position: absolute; top: -6px; right: -6px; background: var(--magenta); color: white; width: 20px; height: 20px; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  .hero { position: relative; padding: 80px 28px 60px; text-align: center; overflow: hidden; }
  .hero::before { content: ''; position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(54,236,223,0.08) 0%, transparent 70%); pointer-events: none; }
  .hero::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--cyan), var(--magenta), transparent); }
  .hero-logo { display: flex; justify-content: center; margin-bottom: 24px; animation: fadeUp 0.6s ease both; }
  .hero-eyebrow { font-family: 'Oxanium', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 5px; color: var(--cyan); text-transform: uppercase; margin-bottom: 16px; animation: fadeUp 0.6s 0.1s ease both; }
  .hero-title { font-family: 'Oxanium', sans-serif; font-size: clamp(40px,8vw,80px); font-weight: 800; line-height: 1; color: var(--white); letter-spacing: -1px; animation: fadeUp 0.6s 0.15s ease both; }
  .hero-title span { color: var(--cyan); }
  .hero-sub { font-size: 16px; color: var(--gray); margin: 20px auto 0; max-width: 500px; line-height: 1.6; animation: fadeUp 0.6s 0.25s ease both; }
  .hero-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 32px; animation: fadeUp 0.6s 0.3s ease both; }
  .hero-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(54,236,223,0.08); border: 1px solid var(--border); border-radius: 100px; font-size: 13px; color: var(--gray); }
  .hero-pill span { color: var(--cyan); }

  .catalog { padding: 40px 28px 80px; max-width: 1200px; margin: 0 auto; }
  .catalog-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
  .catalog-title { font-family: 'Oxanium', sans-serif; font-size: 22px; font-weight: 700; }
  .catalog-count { font-size: 13px; color: var(--gray); margin-top: 4px; }
  .search-input { background: var(--surface); border: 1px solid var(--border); color: var(--white); padding: 12px 16px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; width: 260px; outline: none; transition: border-color 0.2s; }
  .search-input:focus { border-color: var(--cyan); }
  .search-input::placeholder { color: var(--gray); }

  .cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
  .cat-tab { padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--gray); font-family: 'Oxanium', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
  .cat-tab:hover { border-color: rgba(54,236,223,0.4); color: var(--white); }
  .cat-tab.active { background: var(--cyan); border-color: var(--cyan); color: var(--navy); }

  .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px; gap: 16px; color: var(--gray); }
  .spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--cyan); border-radius: 50%; animation: spin 0.8s linear infinite; }

  .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .product-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: all 0.25s; display: flex; flex-direction: column; backdrop-filter: blur(10px); }
  .product-card:hover { border-color: rgba(54,236,223,0.35); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(54,236,223,0.08); }
  .product-card.out-of-stock { opacity: 0.55; }
  .product-image { width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #0a2d52 0%, #01203F 100%); display: flex; align-items: center; justify-content: center; font-family: 'Oxanium', sans-serif; font-size: 13px; color: rgba(54,236,223,0.3); letter-spacing: 2px; font-weight: 600; position: relative; overflow: hidden; }
  .product-image img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .stock-badge { position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; background: rgba(1,32,63,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); z-index: 1; }
  .stock-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .product-body { padding: 18px; flex: 1; display: flex; flex-direction: column; }
  .product-category { font-family: 'Oxanium', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 2px; color: var(--cyan); text-transform: uppercase; margin-bottom: 6px; opacity: 0.7; }
  .product-name { font-family: 'Oxanium', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); margin-bottom: 16px; line-height: 1.3; flex: 1; }
  .price-block { margin-bottom: 16px; }
  .price-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
  .price-row:first-child { border-bottom: 1px solid var(--border); }
  .price-label { font-size: 12px; color: var(--gray); }
  .price-value { font-family: 'Oxanium', sans-serif; font-size: 16px; font-weight: 700; color: var(--white); }
  .price-value.highlight { color: var(--cyan); font-size: 18px; }
  .product-actions { display: flex; gap: 8px; margin-top: auto; }
  .btn-cart { flex: 1; padding: 11px; border-radius: 9px; border: none; background: var(--cyan); color: var(--navy); font-family: 'Oxanium', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
  .btn-cart:hover:not(:disabled) { background: #5ff5ea; }
  .btn-cart:disabled { background: rgba(54,236,223,0.15); color: var(--gray); cursor: not-allowed; }
  .btn-icon { padding: 11px 14px; border-radius: 9px; border: 1px solid var(--border); background: transparent; color: var(--gray); font-size: 14px; cursor: pointer; transition: all 0.2s; text-decoration: none; display: flex; align-items: center; justify-content: center; }
  .btn-icon:hover { border-color: var(--magenta); color: var(--magenta); }
  .btn-wsp { flex: 1; padding: 11px; border-radius: 9px; border: 1px solid rgba(37,211,102,0.3); background: rgba(37,211,102,0.08); color: #25D366; font-family: 'Oxanium', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; cursor: pointer; transition: all 0.2s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .btn-wsp:hover { background: rgba(37,211,102,0.15); }

  .cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 200; animation: fadeIn 0.2s ease; }
  .cart-sidebar { position: fixed; top: 0; right: 0; bottom: 0; width: min(420px,100vw); background: #021830; border-left: 1px solid var(--border); z-index: 201; display: flex; flex-direction: column; animation: slideIn 0.3s ease; }
  .cart-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border); }
  .cart-header-title { font-family: 'Oxanium', sans-serif; font-size: 18px; font-weight: 700; }
  .close-btn { background: var(--surface); border: 1px solid var(--border); color: var(--gray); width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .close-btn:hover { color: var(--white); border-color: var(--cyan); }
  .cart-items { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
  .cart-item { display: flex; gap: 12px; padding: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; align-items: center; }
  .cart-item-info { flex: 1; }
  .cart-item-cat { font-family: 'Oxanium', sans-serif; font-size: 10px; color: var(--cyan); letter-spacing: 1.5px; opacity: 0.7; text-transform: uppercase; }
  .cart-item-name { font-family: 'Oxanium', sans-serif; font-size: 14px; font-weight: 700; margin: 3px 0; }
  .cart-item-price { font-size: 13px; color: var(--gray); }
  .cart-item-price span { color: var(--cyan); font-weight: 600; }
  .cart-qty { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--white); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .qty-btn:hover { border-color: var(--cyan); color: var(--cyan); }
  .qty-val { font-family: 'Oxanium', sans-serif; font-weight: 700; min-width: 20px; text-align: center; }
  .cart-footer { padding: 20px 24px; border-top: 1px solid var(--border); }
  .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .cart-total-label { font-size: 14px; color: var(--gray); }
  .cart-total-value { font-family: 'Oxanium', sans-serif; font-size: 22px; font-weight: 800; color: var(--cyan); }
  .cart-total-cuotas { font-size: 12px; color: var(--gray); text-align: right; margin-bottom: 20px; }
  .btn-wsp-checkout { width: 100%; padding: 16px; border-radius: 12px; border: none; background: #25D366; color: white; font-family: 'Oxanium', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .btn-wsp-checkout:hover { background: #1fb855; }
  .cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--gray); font-size: 14px; text-align: center; padding: 40px; }
  .cart-empty-icon { font-size: 48px; opacity: 0.3; }

  .footer { border-top: 1px solid var(--border); padding: 40px 28px; text-align: center; }
  .footer-logo { margin-bottom: 16px; display: flex; justify-content: center; }
  .footer-links { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 16px; }
  .footer-link { font-size: 13px; color: var(--gray); display: flex; align-items: center; gap: 6px; text-decoration: none; transition: color 0.2s; }
  .footer-link:hover { color: var(--cyan); }
  .footer-copy { font-size: 12px; color: rgba(139,165,192,0.4); letter-spacing: 1px; }

  .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--navy-light); border: 1px solid var(--cyan); color: var(--white); padding: 12px 24px; border-radius: 100px; font-size: 14px; font-weight: 500; z-index: 300; display: flex; align-items: center; gap: 8px; animation: toastIn 0.3s ease; white-space: nowrap; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .navbar { padding: 12px 16px; }
    .hero { padding: 50px 16px 40px; }
    .catalog { padding: 28px 16px 60px; }
    .catalog-header { flex-direction: column; align-items: flex-start; }
    .search-input { width: 100%; }
    .product-grid { grid-template-columns: 1fr; }
  }
`;

export default function STImportados() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const allProducts = [];
      let idCounter = 1;
      for (const tab of SHEET_TABS) {
        try {
          const res = await fetch(`${BASE_URL}&gid=${tab.gid}`);
          const text = await res.text();
          const rows = parseCSV(text);
          for (const row of rows) {
            const nombre = (row["PRODUCTO"] || row["Producto"] || "").trim();
            const cantidad = parseInt(row["CANTIDAD"] || row["Cantidad"] || "0") || 0;
            const cuotasKey = Object.keys(row).find((k) => k.toUpperCase().includes("LISTA") || k.toUpperCase().includes("INTERES"));
            const contadoKey = Object.keys(row).find((k) => k.toUpperCase().includes("DESCUENTO") || k.toUpperCase().includes("TRANSFE") || k.toUpperCase().includes("EFEC"));
            const modeloKey = Object.keys(row).find((k) => k.toUpperCase().includes("MODELO") || k.toUpperCase().includes("LINK"));
            const activoKey = Object.keys(row).find((k) => k.toUpperCase().includes("ACTIVO"));
            const activo = (row[activoKey] || "").toUpperCase() === "SI";
            if (!nombre || !activo) continue;
            allProducts.push({
              id: idCounter++,
              nombre,
              categoria: tab.nombre,
              cantidad,
              precioCuotas: parsePrice(row[cuotasKey]),
              precioContado: parsePrice(row[contadoKey]),
              modelo: tab.tieneCasio && modeloKey ? (row[modeloKey] || "").trim() : null,
            });
          }
        } catch (err) {
          console.error(`Error cargando ${tab.nombre}:`, err);
        }
      }
      setProducts(allProducts);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.categoria))];
    return ["TODOS", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === "TODOS" || p.categoria === activeCategory;
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, search]);

  const cartCount = cart.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cart.reduce((a, i) => a + i.precioContado * i.qty, 0);
  const cartTotalCuotas = cart.reduce((a, i) => a + i.precioCuotas * i.qty, 0);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) return prev.map((i) => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, product.cantidad) } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.nombre} agregado`);
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const handleCheckout = () => {
    if (!cart.length) return;
    const lines = cart.map((i) => `• ${i.nombre} (x${i.qty}) — ${fmt(i.precioContado * i.qty)} contado`);
    const msg = ["🛒 *Pedido ST Importados*", "", ...lines, "", `*Total contado/transf:* ${fmt(cartTotal)}`, `*Total en cuotas:* ${fmt(cartTotalCuotas)}`, "", "¿Podés confirmar disponibilidad?"].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const wspProduct = (p) => {
    const msg = `Hola! Me interesa *${p.nombre}* (${p.categoria}).\nPrecio contado: ${fmt(p.precioContado)}\n¿Está disponible?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <STLogo size={36} color="#36ECDF" />
          <span className="navbar-title">ST Importados</span>
        </div>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          🛒 Carrito
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </nav>

      <section className="hero">
        <div className="hero-logo"><STLogo size={72} color="#36ECDF" /></div>
        <p className="hero-eyebrow">Showroom · Electrónica · Relojes</p>
        <h1 className="hero-title">ST <span>Importados</span></h1>
        <p className="hero-sub">Stock disponible y precios actualizados. Tecnología y relojes de calidad, directo del showroom.</p>
        <div className="hero-pills">
          <div className="hero-pill">📍 <span>{SHOWROOM}</span></div>
          <div className="hero-pill">💳 <span>3 cuotas sin interés</span></div>
          <div className="hero-pill">💸 <span>Descuento contado / transf.</span></div>
          <div className="hero-pill">📲 <span>{INSTAGRAM}</span></div>
        </div>
      </section>

      <section className="catalog">
        <div className="catalog-header">
          <div>
            <div className="catalog-title">Catálogo</div>
            <div className="catalog-count">{loading ? "Cargando..." : `${filtered.length} productos`}</div>
          </div>
          <input className="search-input" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {!loading && (
          <div className="cat-tabs">
            {categories.map((cat) => (
              <button key={cat} className={`cat-tab ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
                {CATEGORY_ICONS[cat] || "◆"} {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Cargando productos...</span></div>
        ) : (
          <div className="product-grid">
            {filtered.map((product) => {
              const stock = getStockStatus(product.cantidad);
              const inCart = cart.find((i) => i.id === product.id);
              return (
                <div key={product.id} className={`product-card ${product.cantidad === 0 ? "out-of-stock" : ""}`}>
                  <div className="product-image">
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>{CATEGORY_ICONS[product.categoria] || "◆"}</div>
                      <div>{product.nombre}</div>
                    </div>
                    <div className="stock-badge">
                      <div className="stock-dot" style={{ background: stock.dot }} />
                      <span style={{ color: stock.color, fontSize: 11 }}>{stock.label}</span>
                    </div>
                  </div>
                  <div className="product-body">
                    <div className="product-category">{product.categoria}</div>
                    <div className="product-name">{product.nombre}</div>
                    <div className="price-block">
                      <div className="price-row">
                        <span className="price-label">3 cuotas sin interés</span>
                        <span className="price-value">{fmt(product.precioCuotas)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Contado / transf.</span>
                        <span className="price-value highlight">{fmt(product.precioContado)}</span>
                      </div>
                    </div>
                    <div className="product-actions">
                      <button className="btn-cart" onClick={() => addToCart(product)} disabled={product.cantidad === 0}>
                        {product.cantidad === 0 ? "Sin stock" : inCart ? "✓ Agregado" : "+ Carrito"}
                      </button>
                      {product.modelo ? (
                        <a href={product.modelo} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Ver en Casio.com">🌐</a>
                      ) : (
                        <a href={wspProduct(product)} target="_blank" rel="noopener noreferrer" className="btn-wsp">💬 Consultar</a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--gray)" }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔍</div>
                No se encontraron productos para "{search}"
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footer-logo"><STLogo size={40} color="#36ECDF" /></div>
        <div className="footer-links">
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="footer-link">💬 WhatsApp</a>
          <span className="footer-link">📍 {SHOWROOM}</span>
          <span className="footer-link">📲 {INSTAGRAM}</span>
        </div>
        <p className="footer-copy">© 2026 ST IMPORTADOS — TODOS LOS DERECHOS RESERVADOS</p>
      </footer>

      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-sidebar">
            <div className="cart-header">
              <span className="cart-header-title">🛒 Mi pedido ({cartCount})</span>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛒</div>
                <p>Tu carrito está vacío</p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>Agregá productos para armar tu pedido</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-cat">{item.categoria}</div>
                      <div className="cart-item-name">{item.nombre}</div>
                      <div className="cart-item-price"><span>{fmt(item.precioContado)}</span> contado</div>
                    </div>
                    <div className="cart-qty">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-val">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-row">
                  <span className="cart-total-label">Total contado</span>
                  <span className="cart-total-value">{fmt(cartTotal)}</span>
                </div>
                <div className="cart-total-cuotas">En cuotas: {fmt(cartTotalCuotas)}</div>
                <button className="btn-wsp-checkout" onClick={handleCheckout}>
                  <span>💬</span> Consultar por WhatsApp
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}
