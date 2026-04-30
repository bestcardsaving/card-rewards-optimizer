import React, { useState, useEffect, useMemo } from "react";

// --- CONFIGURATION ---
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

const POPULAR_STORES = [
  { name: "Walmart", icon: "🏪", category: "walmart" },
  { name: "Target", icon: "🎯", category: "target" },
  { name: "Costco", icon: "📦", category: "wholesale" },
  { name: "Amazon", icon: "📱", category: "amazon" },
  { name: "Starbucks", icon: "☕", category: "dining" },
  { name: "Gas Station", icon: "⛽", category: "gas" },
  { name: "Grocery", icon: "🛒", category: "grocery" }
];

// --- UI COMPONENTS ---
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

function SavingsCalc({ topRate, secondRate }) {
  const [amount, setAmount] = useState(100);
  const diff = ((amount * topRate / 100) - (amount * secondRate / 100)).toFixed(2);
  
  return (
    <div style={{ background: "rgba(0,200,83,0.06)", borderRadius: 14, padding: 18, border: "1px solid rgba(0,200,83,0.15)", marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#00c853", textTransform: "uppercase", marginBottom: 10 }}>💰 Savings Calculator</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#888" }}>Spending: $</span>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} 
          style={{ border: "none", background: "#f5f5f5", borderRadius: 8, padding: "4px 10px", width: 80, fontWeight: 700 }} />
      </div>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 10, padding: 10, border: "1px solid #e0e0e0" }}>
        <div style={{ fontSize: 11, color: "#888" }}>Extra Savings with Best Card</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ff6600" }}>${diff}</div>
      </div>
    </div>
  );
}

function CreditCard({ card, rate, isTop }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${card.color || '#1a4480'}, #1a1a1a)`,
      borderRadius: 14, padding: "18px 20px", color: "#fff", position: "relative",
      transform: isTop ? "scale(1)" : "scale(0.97)", opacity: isTop ? 1 : 0.85,
      transition: "all 0.3s ease", boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>{card.issuer}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{card.name}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(10px)" }}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{rate}%</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <CardChip />
        <a href={card.applyLink} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", background: "#fff", color: "#000", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>APPLY NOW</a>
      </div>
      {isTop && (
        <div style={{ position: "absolute", top: -1, right: 20, background: "#00c853", color: "#fff", padding: "4px 12px", borderRadius: "0 0 8px 8px", fontSize: 10, fontWeight: 800 }}>★ BEST PICK</div>
      )}
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetch(CSV_URL).then(res => res.text()).then(text => {
      const rows = text.split('\n').slice(1);
      const parsed = rows.map(row => {
        const cols = row.split(',');
        return {
          id: cols[0], name: cols[1], issuer: cols[2], color: cols[3],
          categories: { grocery: cols[4], dining: cols[5], gas: cols[6], target: cols[7], walmart: cols[8], amazon: cols[8] },
          applyLink: cols[9]
        };
      }).filter(c => c.id);
      setCards(parsed);
      setLoading(false);
    });
  }, []);

  const currentCategory = useMemo(() => {
    const term = searchText.toLowerCase();
    if (term.includes("walmart")) return "walmart";
    if (term.includes("target")) return "target";
    if (term.includes("amazon")) return "amazon";
    if (term.includes("gas") || term.includes("fuel")) return "gas";
    if (term.includes("eat") || term.includes("food") || term.includes("restau")) return "dining";
    return "grocery";
  }, [searchText]);

  const results = useMemo(() => {
    if (!searchText) return cards;
    return [...cards].sort((a, b) => (parseFloat(b.categories[currentCategory]) || 1) - (parseFloat(a.categories[currentCategory]) || 1));
  }, [searchText, cards, currentCategory]);

  if (loading) return <div style={{ textAlign: "center", padding: 50 }}>Syncing Rewards...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#fafafa", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "32px 20px", borderRadius: "0 0 28px 28px", color: "#fff" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Search any store for the best rewards.</p>
      </div>

      <div style={{ padding: 16 }}>
        <input style={{ width: "100%", padding: 16, borderRadius: 14, border: "1px solid #eee", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", outline: "none" }}
          placeholder="Where are you shopping?" value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>

      {!searchText && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10 }}>POPULAR STORES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POPULAR_STORES.map(s => (
              <button key={s.name} onClick={() => setSearchText(s.name)} style={{ padding: "8px 16px", borderRadius: 50, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {results.map((card, i) => (
          <CreditCard key={card.id} card={card} rate={parseFloat(card.categories[currentCategory]) || 1} isTop={i === 0 && searchText !== ""} />
        ))}
      </div>

      {searchText && results.length > 1 && (
        <div style={{ padding: "0 16px 24px" }}>
          <SavingsCalc topRate={parseFloat(results[0].categories[currentCategory])} secondRate={parseFloat(results[1].categories[currentCategory])} />
        </div>
      )}
    </div>
  );
}
