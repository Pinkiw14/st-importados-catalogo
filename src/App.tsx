import "./App.css";

const HEADER = "/assets/stimportados-header.png";
const LOGO = "/assets/stimportados-logo.jpg";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ textAlign: "center", padding: "16px 16px 0" }}>
        <img
          src={HEADER}
          alt="ST Importados"
          style={{
            width: "100%",
            maxWidth: 1200,
            height: 260,
            objectFit: "cover",
            borderRadius: 20,
            display: "block",
            margin: "0 auto",
          }}
        />
        <img
          src={LOGO}
          alt="Logo ST Importados"
          style={{
            height: 84,
            width: 84,
            objectFit: "cover",
            borderRadius: 18,
            marginTop: -42,
            border: "3px solid rgba(255,255,255,0.12)",
          }}
        />
        <p style={{ opacity: 0.9, marginTop: 10 }}>
          Stock disponible y precios actualizados. Consultá y reservá por WhatsApp.
        </p>
      </header>

      <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Catálogo ST Importados</h1>
        <p>Ahora conectamos el Google Sheets y cargamos todas las categorías.</p>
      </main>
    </div>
  );
}
