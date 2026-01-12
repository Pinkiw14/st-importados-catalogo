import React, { useEffect, useMemo, useState } from "react";
import { CATEGORY_ORDER, CategoryKey, fetchAllProducts, Product } from "./lib/products";
import { cx, formatARS, slugifyForFile } from "./lib/utils";

const WHATSAPP_PHONE = "5492975416017"; // +54 9 297 541 6017

const BANNER_SRC = "/assets/stimportados-header.png";

type ImgCandidate = { src: string; alt: string };

function imageCandidates(category: string, name: string): ImgCandidate[] {
  const baseFolder = `/images/${category}`;
  const base = slugifyForFile(name);
  const raw = name.trim();
  const rawHyph = raw.replace(/\s+/g, "-");
  const variants = Array.from(new Set([base, rawHyph, raw]));
  const exts = [".jpg", ".jpeg", ".png", ".webp"];
  const list: ImgCandidate[] = [];
  for (const v of variants) {
    for (const e of exts) {
      list.push({ src: `${baseFolder}/${v}${e}`, alt: name });
    }
  }
  return list;
}

function ProductImage({ category, name }: { category: string; name: string }) {
  const candidates = useMemo(() => imageCandidates(category, name), [category, name]);
  const [idx, setIdx] = useState(0);

  const current = candidates[idx] ?? { src: "/assets/stimportados-logo.jpg", alt: name };

    return (
    <img
      className="cardImg"
      style={{ cursor: "zoom-in" }}
      src={current.src}
      alt={current.alt}
      loading="lazy"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("open-image", { detail: current }))
      }
      onError={() => {
        if (idx < candidates.length - 1) setIdx(idx + 1);
      }}
    />
  );
}

function waLink(p: Product) {
  const parts: string[] = [
    "Hola! Quería consultar por este producto:",
    `• ${p.name}`,
    `• Categoría: ${p.category}`,
  ];
  if (p.priceList !== null) parts.push(`• Precio lista (3 cuotas): ${formatARS(p.priceList)}`);
  if (p.priceCash !== null) parts.push(`• Efectivo / transferencia: ${formatARS(p.priceCash)}`);
  parts.push("", "¿Hay disponibilidad? Gracias!");
  const text = encodeURIComponent(parts.join("\n"));
  return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
}

export default function App() {
    const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const today = new Date().toLocaleDateString("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});


  useEffect(() => {
    const handler = (e: any) => {
      setImgSrc(e.detail.src);
      setImgAlt(e.detail.alt);
      setImgOpen(true);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImgOpen(false);
    };
    window.addEventListener("open-image", handler as any);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("open-image", handler as any);
      window.removeEventListener("keydown", esc);
    };
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryKey | "TODOS">("TODOS");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await fetchAllProducts();
        if (alive) setProducts(all);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "TODOS" && p.category !== cat) return false;
      if (!qq) return true;
      return p.name.toLowerCase().includes(qq);
    });
  }, [products, q, cat]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of CATEGORY_ORDER) m.set(c, 0);
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  return (
    <div className="page">
      <div className="bannerWrap">
        <div className="bannerCard">
          <img className="bannerImg" src={BANNER_SRC} alt="ST Importados" />
          <div className="bannerText">
            <div className="bannerTitle">
              Catálogo ST Importados
            </div>
            <div className="bannerSubtitle">
              Stock disponible y precios actualizados. Consultá y reservá por WhatsApp.
            </div>

            <div className="chips">
  <a
    className="chip chipLink"
    href="https://maps.app.goo.gl/BxqWoWX2sJodeXRE6"
    target="_blank"
    rel="noreferrer"
  >
    📍 Showroom: España 675
  </a>

  <a
    className="chip chipLink igChip"
    href="https://www.instagram.com/st.importados__/"
    target="_blank"
    rel="noreferrer"
  >
    <img src="/assets/instagram.png" alt="Instagram" />
    <span>@st.importados__</span>
  </a>

  <span className="chip">💳 3 cuotas sin interés</span>
  <span className="chip">💸 Descuento contado / transferencia</span>
  <span className="chip">🕒 Actualizado: {today}</span>
</div>

          </div>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar (ej: MW-240)..."
          aria-label="Buscar"
        />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value as any)} aria-label="Categoría">
          <option value="TODOS">TODOS</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {c} ({counts.get(c) ?? 0})
            </option>
          ))}
        </select>
      </div>

      <div className="hintRow">
        <div className="hintRight">Consultas por WhatsApp con mensaje armado.</div>
      </div>

      {loading ? (
        <div className="loading">Cargando productos…</div>
      ) : (
        <div className="grid">
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div className="imgFrame">
                <ProductImage category={p.category} name={p.name} />
              </div>

              <div className="cardBody">
                <div className="nameRow">
                  <div className="name">{p.name}</div>
                </div>

                {p.modelUrl ? (
  <div className="modelLine">
    Ver modelo oficial:{" "}
    <a className="modelLink" href={p.modelUrl} target="_blank" rel="noreferrer">
      Casio
    </a>
  </div>
) : p.category === "VAPER" ? (
  <div className="modelLine">
    Consultar sabores 🍓
  </div>
) : (
  <div className="modelLine muted">&nbsp;</div>
)}

                <div className="prices">
                  <div className="priceLine">
                    <span className="priceLabel">3 cuotas sin interés</span>
                    <span className="priceValue">{formatARS(p.priceList)}</span>
                  </div>
                  <div className="priceLine">
                    <span className="priceLabel">Contado / transferencia</span>
                    <span className="priceValue">{formatARS(p.priceCash)}</span>
                  </div>
                </div>

                <div className={cx("actions", p.modelUrl ? "" : "one")}>
                  <a className="btnWA" href={waLink(p)} target="_blank" rel="noreferrer">
                    📲 Consultar por WhatsApp
                  </a>
                  {p.modelUrl ? (
                    <a className="btnAlt" href={p.modelUrl} target="_blank" rel="noreferrer">
                      🔎 Ver en Casio
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {imgOpen && (
        <div
          onClick={() => setImgOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={imgSrc}
            alt={imgAlt}
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <div className="footerSpace" />
    </div>
  );
}
