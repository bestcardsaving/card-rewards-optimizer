import React, { useState, useEffect, useMemo } from "react";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

// Logic to identify US Merchant Overrides
const mapSearchToCategory = (term) => {
  const t = term.toLowerCase();
  
  // 1. Merchant Overrides (Exclusions from Grocery)
  if (t.includes("costco") || t.includes("sam's club") || t.includes("bj's")) return "all"; // Wholesale usually codes as 1-2%
  if (t.includes("walmart")) return "walmart";
  if (t.includes("target")) return "target";
  if (t.includes("amazon")) return "amazon";

  // 2. US Category Keywords
  const gasKeywords = ["gas", "fuel", "shell", "exxon", "mobil", "chevron", "76", "speedway"];
  const diningKeywords = ["dining", "restaurant", "food", "eat", "cafe", "starbucks", "mcdonald", "pizza", "chipotle", "subway"];
  const groceryKeywords = ["grocery", "market", "supermarket", "kroger", "publix", "aldi", "whole foods", "trader joe", "safeway", "vons", "meijer"];
  
  if (gasKeywords.some(k => t.includes(k))) return "gas";
  if (diningKeywords.some(k => t.includes(k))) return "dining";
  if (groceryKeywords.some(k => t.includes(k))) return "grocery";
  
  return "all"; 
};

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
      {/* US Launch Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "40px 20px 30px", borderRadius: "0 0 30px 30px", color: "#fff", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.7, fontSize: 14, marginTop: 8 }}>Optimized for 90% of US Merchants.</p>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <input 
          style={{ width: "100%", padding: "18px", borderRadius: "16px", border: "1px solid #ddd", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", outline: "none", fontSize: 16 }}
          placeholder="Where are you shopping? (e.g. Costco)" 
          value={searchText} 
          onChange={e => setSearchText(e.target.value)} 
        />
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 15 }}>
        {results.map((card, i) => (
          <div key={card.id} style={{
            background: `linear-gradient(135deg, ${card.color || '#1a4480'}, #111)`,
            borderRadius: "20px", padding: "22px", color: "#fff", position: "relative",
            boxShadow: i === 0 && searchText ? "0 12px 30px rgba(0,0,0,0.2)" : "0 4px 10px rgba(0,0,0,0.1)",
            transform: i === 0 && searchText ? "scale(1.02)" : "scale(1)",
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{card.issuer}</div>
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
