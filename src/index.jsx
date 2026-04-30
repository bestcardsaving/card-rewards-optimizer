import React, { useState, useEffect, useRef, useMemo } from "react";

// Your Google Sheets CSV URL
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

// Keeping your popular stores list for the UX
const POPULAR_STORES = [
  { name: "Walmart", icon: "🏪", category: "walmart" },
  { name: "Target", icon: "🎯", category: "target" },
  { name: "Gas", icon: "⛽", category: "gas" },
  { name: "Grocery", icon: "🛒", category: "grocery" },
  { name: "Dining", icon: "☕", category: "dining" },
];

// --- KEEPING ALL YOUR BEAUTIFUL UI COMPONENTS ---
function CardChip() {
  return (
    <div style={{
      width: 32, height: 24, borderRadius: 4,
      background: "linear-gradient(135deg, #e8d5a3 0%, #c9a84c 40%, #e8d5a3 60%, #c9a84c 100%)",
      border: "1px solid rgba(0,0,0,0.15)", position: "relative"
    }}>
      <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }} />
    </div>
  );
}

function CreditCard({ card, rate, isTop, applyLink }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${card.color}, #1a1a1a)`,
      borderRadius: 14, padding: "18px 20px", color: "#fff", position: "relative",
      transform: isTop ? "scale(1)" : "scale(0.97)", opacity: isTop ? 1 : 0.85,
      transition: "all 0.3s ease", boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>{card.issuer}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{card.name}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(10px)" }}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{rate}%</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CardChip />
        <a href={applyLink} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", background: "#fff", color: "#000", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>
          APPLY NOW
        </a>
      </div>
      {isTop && (
        <div style={{ position: "absolute", top: -1, right: 20, background: "#00c853", color: "#fff", padding: "4px 12px", borderRadius: "0 0 8px 8px", fontSize: 10, fontWeight: 800 }}>
          ★ BEST PICK
        </div>
      )}
    </div>
  );
}

// --- MAIN APPLICATION LOGIC ---
export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    fetch(CSV_URL)
      .then(res => res.text())
      .then(text => {
        const rows = text.split('\n').slice(1);
        const parsed = rows.map(row => {
          const [id, name, issuer, color, grocery, dining, gas, target, walmart, applyLink] = row.split(',');
          return {
            id, name, issuer, color, applyLink,
            categories: { grocery, dining, gas, target, walmart }
          };
        }).filter(c => c.id);
        setCards(parsed);
        setLoading(false);
      });
  }, []);

  const results = useMemo(() => {
    if (!searchText) return cards;
    const term = searchText.toLowerCase();
    return [...cards].sort((a, b) => (parseFloat(b.categories[term]) || 1) - (parseFloat(a.categories[term]) || 1));
  }, [searchText, cards]);

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Syncing Rewards...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#fafafa", minHeight: "100vh", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1a2e", padding: "32px 20px", borderRadius: "0 0 28px 28px", color: "#fff" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Dynamic Rewards from Google Sheets</p>
      </div>

      {/* Search */}
      <div style={{ padding: 16 }}>
        <input 
          style={{ width: "100%", padding: 16, borderRadius: 14, border: "1px solid #eee", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          placeholder="Where are you shopping?"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      {/* List */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((card, i) => (
          <CreditCard 
            key={card.id} 
            card={card} 
            rate={parseFloat(card.categories[searchText.toLowerCase()]) || 1} 
            isTop={i === 0 && searchText !== ""}
            applyLink={card.applyLink}
          />
        ))}
      </div>
    </div>
  );
}
