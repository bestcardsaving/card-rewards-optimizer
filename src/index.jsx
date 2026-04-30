import React, { useState, useEffect, useMemo } from "react";

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

// Logic for US Merchant Overrides
const mapSearchToCategory = (term) => {
  const t = term.toLowerCase();
  if (t.includes("costco") || t.includes("sam's club") || t.includes("bj's")) return "all"; 
  if (t.includes("walmart")) return "walmart";
  if (t.includes("target")) return "target";
  if (t.includes("amazon")) return "amazon";
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
        // 2% sorting safety net
        const baseReward = parseFloat(cols[4]) === 2 ? 2.01 : 1; 
        return {
          id: cols[0], name: cols[1], issuer: cols[2], color: cols[3],
          categories: { 
            grocery: parseFloat(cols[4]), dining: parseFloat(cols[5]), gas: parseFloat(cols[6]), 
            target: parseFloat(cols[7]), walmart: parseFloat(cols[8]), amazon: parseFloat(cols[8]), 
            all: baseReward 
          },
          applyLink: cols[9],
          imgUrl: cols[10]?.trim()
        };
      }).filter(c => c.id);
      setCards(parsed);
      setLoading(false);
    });
  }, []);

  const currentCategory = useMemo(() => mapSearchToCategory(searchText), [searchText]);
  const results = useMemo(() => {
    return [...cards].sort((a, b) => {
      const rateA = parseFloat(a.categories[currentCategory]) || a.categories.all;
      const rateB = parseFloat(b.categories[currentCategory]) || b.categories.all;
      return rateB - rateA;
    });
  }, [searchText, cards, currentCategory]);

  if (loading) return <div style={{ textAlign: "center", padding: 100, fontFamily: "sans-serif" }}>Syncing Rewards...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#f8fafc", minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: 40 }}>
      <div style={{ background: "#1a243d", padding: "40px 20px", borderRadius: "0 0 32px 32px", color: "#fff", textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Card Optimizer</h1>
        <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>The 90% Coverage No-Fee Edition.</p>
      </div>

      <div style={{ padding: "20px 16px" }}>
        <input 
          style={{ width: "100%", padding: "18px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", outline: "none", fontSize: 16 }}
          placeholder="Where are you shopping? (e.g. Costco)" 
          value={searchText} 
          onChange={e => setSearchText(e.target.value)} 
        />
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {results.map((card, i) => {
          const displayRate = parseFloat(card.categories[currentCategory]) || Math.floor(card.categories.all);
          const isTop = i === 0 && searchText !== "";
          return (
            <div key={card.id} style={{
              background: `linear-gradient(135deg, ${card.color || '#1e293b'}, #0f172a)`,
              borderRadius: "24px", padding: "22px", color: "#fff", position: "relative",
              boxShadow: isTop ? "0 20px 25px -5px rgb(0 0 0 / 0.15)" : "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              transform: isTop ? "scale(1.02)" : "scale(1)", transition: "all 0.3s ease"
            }}>
              {isTop && (
                <div style={{ position: "absolute", top: -12, right: 24, background: "#00c853", color: "#fff", padding: "4px 14px", borderRadius: "10px", fontSize: 10, fontWeight: 900 }}>
                  ★ BEST FOR {currentCategory === "all" ? "COSTCO" : currentCategory.toUpperCase()}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {card.imgUrl ? (
                    <img src={card.imgUrl} alt={card.name} style={{ width: 85, height: 54, borderRadius: 6, boxShadow: "0 4px 8px rgba(0,0,0,0.4)" }} />
                  ) : (
                    <div style={{ width: 85, height: 54, borderRadius: 6, background: "rgba(255,255,255,0.1)" }} />
                  )}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>{card.issuer}</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{card.name}</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "14px", padding: "8px 16px", backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: 24, fontWeight: 900 }}>{displayRate}%</span>
                </div>
              </div>
              <div style={{ marginTop: 22 }}>
                <a href={card.applyLink} target="_blank" rel="noreferrer" style={{ background: "#fff", color: "#000", padding: "10px 24px", borderRadius: "12px", fontSize: 12, fontWeight: 900, textDecoration: "none", display: "inline-block" }}>
                  APPLY NOW
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
