import React, { useState, useEffect, useMemo } from "react";

// This is your live database link
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

// These are the quick-tap buttons for your users
const POPULAR_STORES = [
  { name: "Walmart", icon: "🏪", category: "walmart" },
  { name: "Target", icon: "🎯", category: "target" },
  { name: "Amazon", icon: "📱", category: "amazon" },
  { name: "Gas Station", icon: "⛽", category: "gas" },
  { name: "Grocery", icon: "🛒", category: "grocery" },
  { name: "Dining", icon: "☕", category: "dining" }
];

// This helper "reads" what the user types and picks the right category
const mapSearchToCategory = (term) => {
  const t = term.toLowerCase();
  if (t.includes("walmart")) return "walmart";
  if (t.includes("target")) return "target";
  if (t.includes("amazon")) return "amazon";
  
  const gasKeywords = ["gas", "fuel", "shell", "exxon", "mobil", "chevron", "76", "costco gas"];
  const diningKeywords = ["dining", "restaurant", "food", "eat", "cafe", "starbucks", "mcdonald", "pizza", "chipotle", "subway"];
  const groceryKeywords = ["grocery", "market", "supermarket", "kroger", "publix", "aldi", "whole foods", "trader joe", "safeway"];
  
  if (gasKeywords.some(k => t.includes(k))) return "gas";
  if (diningKeywords.some(k => t.includes(k))) return "dining";
  if (groceryKeywords.some(k => t.includes(k))) return "grocery";
  
  return "all"; 
};

export default function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState(100);

  // Fetch your Google Sheet data
  useEffect(() => {
    fetch(CSV_URL).then(res => res.text()).then(text => {
      const rows = text.split('\n').slice(1);
      const parsed = rows.map(row => {
        const cols = row.split(',');
        return {
          id: cols[0], name: cols[1], issuer: cols[2], color: cols[3],
          categories: { grocery: cols[4], dining: cols[5], gas: cols[6], target: cols[7], walmart: cols[8], amazon: cols[8], all: 1 },
          applyLink: cols[9]
        };
      }).filter(c => c.id);
      setCards(parsed);
      setLoading(false);
    });
  }, []);

  const currentCategory = useMemo(() => mapSearchToCategory(searchText), [searchText]);

  const results = useMemo(() => {
    if (!searchText) return cards;
    return [...cards].sort((a, b) => (parseFloat(b.categories[currentCategory]) || 1) - (parseFloat(a.categories[currentCategory]) || 1));
  }, [searchText, cards, currentCategory]);

  if (loading) return <div style={{ textAlign: "center", padding: 50, fontFamily: "sans-serif" }}>Syncing latest rewards...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#fafafa", minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: 40 }}>
      {/* Blue Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", padding: "40px 20px", borderRadius: "0 0 30px 30px", color: "#fff", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginTop: 8 }}>Maximize your cashback at every store.</p>
      </div>

      {/* Search Input */}
      <div style={{ padding: "20px 16px" }}>
        <input 
          style={{ width: "100%", padding: "18px", borderRadius: "16px", border: "1px solid #ddd", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", outline: "none", fontSize: 16 }}
          placeholder="Where are you shopping? (e.g. Shell)" 
          value={searchText} 
          onChange={e => setSearchText(e.target.value)} 
        />
      </div>

      {/* Suggested Store Chips */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#999", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Popular Categories</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {POPULAR_STORES.map(s => (
            <button 
              key={s.name} 
              onClick={() => setSearchText(s.name)} 
              style={{ padding: "10px 16px", borderRadius: "50px", border: "1px solid #eee", background: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Savings Calculator (Only shows when searching) */}
      {searchText && results.length > 1 && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ background: "rgba(0,200,83,0.08)", borderRadius: "18px", padding: "20px", border: "1px solid rgba(0,200,83,0.2)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#00c853", marginBottom: 12 }}>💰 SAVINGS CALCULATOR</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Spending:</span>
              <input type="number" value={purchaseAmount} onChange={e => setPurchaseAmount(Number(e.target.value))} 
                style={{ width: "80px", padding: "6px", borderRadius: "8px", border: "1px solid #ddd", fontWeight: 700, textAlign: "center" }} />
            </div>
            <div style={{ background: "#fff", borderRadius: "12px", padding: "15px", textAlign: "center", border: "1px solid #eee" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Extra Cash with Top Card</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ff6600" }}>
                ${((purchaseAmount * parseFloat(results[0].categories[currentCategory] || 1) / 100) - (purchaseAmount * parseFloat(results[1].categories[currentCategory] || 1) / 100)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card List */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 15 }}>
        {results.map((card, i) => (
          <div key={card.id} style={{
            background: `linear-gradient(135deg, ${card.color || '#1a4480'}, #111)`,
            borderRadius: "20px", padding: "22px", color: "#fff", position: "relative",
            boxShadow: i === 0 && searchText ? "0 12px 30px rgba(0,0,0,0.25)" : "0 4px 10px rgba(0,0,0,0.1)",
            transform: i === 0 && searchText ? "scale(1.02)" : "scale(1)",
            transition: "all 0.3s ease"
          }}>
            {i === 0 && searchText && (
              <div style={{ position: "absolute", top: -10, right: 20, background: "#00c853", color: "#fff", padding: "5px 15px", borderRadius: "10px", fontSize: 11, fontWeight: 900 }}>★ BEST CHOICE</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: "uppercase" }}>{card.issuer}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{card.name}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "8px 15px", backdropFilter: "blur(5px)" }}>
                <span style={{ fontSize: 28, fontWeight: 900 }}>{parseFloat(card.categories[currentCategory] || 1)}%</span>
              </div>
            </div>
            <a href={card.applyLink} target="_blank" rel="noreferrer" style={{ background: "#fff", color: "#000", padding: "10px 20px", borderRadius: "10px", fontSize: 12, fontWeight: 900, textDecoration: "none", display: "inline-block" }}>
              APPLY NOW
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
