import React, { useState, useEffect, useMemo } from "react";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

// --- THE INTELLIGENT CATEGORY MAPPER ---
const mapSearchToCategory = (term) => {
  const t = term.toLowerCase();
  
  // Specific Store Overrides
  if (t.includes("walmart")) return "walmart";
  if (t.includes("target")) return "target";
  if (t.includes("amazon")) return "amazon";

  // Category Logic (The "Infinite" Database)
  const gasKeywords = ["gas", "fuel", "shell", "exxon", "mobil", "chevron", "speedway", "costco gas"];
  const diningKeywords = ["dining", "restaurant", "food", "eat", "cafe", "starbucks", "mcdonald", "pizza", "chipotle", "subway"];
  const groceryKeywords = ["grocery", "market", "supermarket", "kroger", "publix", "aldi", "whole foods", "trader joe", "safeway"];
  
  if (gasKeywords.some(k => t.includes(k))) return "gas";
  if (diningKeywords.some(k => t.includes(k))) return "dining";
  if (groceryKeywords.some(k => t.includes(k))) return "grocery";
  
  return "all"; // Default to base cashback
};

// --- UI COMPONENTS (PRESERVED) ---
function SavingsCalc({ topRate, secondRate }) {
  const [amount, setAmount] = useState(100);
  const diff = ((amount * topRate / 100) - (amount * secondRate / 100)).toFixed(2);
  return (
    <div style={{ background: "rgba(0,200,83,0.06)", borderRadius: 14, padding: 18, border: "1px solid rgba(0,200,83,0.15)", marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#00c853", textTransform: "uppercase", marginBottom: 10 }}>💰 Savings Calculator</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#888" }}>Spending: $</span>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ border: "none", background: "#f5f5f5", borderRadius: 8, padding: "4px 10px", width: 80, fontWeight: 700 }} />
      </div>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 10, padding: 10, border: "1px solid #e0e0e0" }}>
        <div style={{ fontSize: 11, color: "#888" }}>Extra Savings Today</div>
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
      transition: "all 0.3s ease", marginBottom: 12, boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{card.issuer}</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{card.name}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "6px 14px", backdropFilter: "blur(10px)" }}>
          <span style={{ fontSize: 26, fontWeight: 800 }}>{rate}%</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <a href={card.applyLink} target="_blank" rel="noreferrer" style={{ background: "#fff", color: "#000", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, textDecoration: "none" }}>APPLY NOW</a>
      </div>
      {isTop && <div style={{ position: "absolute", top: -1, right: 20, background: "#00c853", color: "#fff", padding: "4px 12px", borderRadius: "0 0 8px 8px", fontSize: 10, fontWeight: 800 }}>★ BEST PICK</div>}
    </div>
  );
}

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

  const results = useMemo(() => {
    if (!searchText) return cards;
    const cat = mapSearchToCategory(searchText);
    return [...cards].sort((a, b) => (parseFloat(b.categories[cat]) || 1) - (parseFloat(a.categories[cat]) || 1));
  }, [searchText, cards]);

  if (loading) return <div style={{ textAlign: "center", padding: 50 }}>Syncing Rewards...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#fafafa", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ background: "#1a1a2e", padding: "32px 20px", borderRadius: "0 0 28px 28px", color: "#fff" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.6, fontSize: 13 }}>Smart category matching for any store.</p>
      </div>

      <div style={{ padding: 16 }}>
        <input style={{ width: "100%", padding: 16, borderRadius: 14, border: "1px solid #eee", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", outline: "none" }}
          placeholder="Where are you shopping? (e.g. Olive Garden)" value={searchText} onChange={e => setSearchText(e.target.value)} />
      </div>

      <div style={{ padding: 16 }}>
        {results.map((card, i) => (
          <CreditCard key={card.id} card={card} rate={parseFloat(card.categories[mapSearchToCategory(searchText)]) || 1} isTop={i === 0 && searchText !== ""} />
        ))}
      </div>

      {searchText && results.length > 1 && (
        <div style={{ padding: "0 16px 24px" }}>
          <SavingsCalc topRate={parseFloat(results[0].categories[mapSearchToCategory(searchText)])} secondRate={parseFloat(results[1].categories[mapSearchToCategory(searchText)])} />
        </div>
      )}
    </div>
  );
}
