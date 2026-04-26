import React, { useState, useEffect, useRef } from "react";

const CARDS_DB = [
  {
    id: "citi_custom",
    name: "Citi Custom Cash",
    issuer: "Citi",
    color: "#0066b2",
    gradient: "linear-gradient(135deg, #0066b2, #003d6b)",
    baseCashback: 1,
    topCategory: 5,
    annualFee: 0,
    categories: {
      grocery: 5, restaurants: 5, gas: 5, streaming: 5, drugstores: 5,
      home_improvement: 5, fitness: 5, travel: 5, transit: 5
    },
    note: "5% on top eligible spend category each billing cycle (up to $500)",
    specialOffers: [
      { store: "Walmart", type: "cashback_boost", value: 8, expires: "2026-05-31", desc: "8% back on Walmart purchases this month" },
      { store: "Target", type: "cashback_boost", value: 7, expires: "2026-06-15", desc: "7% back on Target purchases" },
    ]
  },
  {
    id: "chase_freedom_flex",
    name: "Chase Freedom Flex",
    issuer: "Chase",
    color: "#1a4480",
    gradient: "linear-gradient(135deg, #1a4480, #0d2240)",
    baseCashback: 1,
    topCategory: 5,
    annualFee: 0,
    categories: {
      grocery: 5, restaurants: 3, drugstores: 3, travel_chase: 5,
    },
    note: "5% on quarterly rotating categories (activate required), 3% dining & drugstores",
    specialOffers: [
      { store: "Walmart", type: "cashback_boost", value: 5, expires: "2026-06-30", desc: "Q2 rotating: 5% at Walmart" },
      { store: "Amazon", type: "cashback_boost", value: 5, expires: "2026-06-30", desc: "Q2 rotating: 5% at Amazon" },
      { store: "Costco", type: "cashback_boost", value: 3, expires: "2026-05-15", desc: "3% bonus at Costco" },
    ]
  },
  {
    id: "amex_blue_cash_preferred",
    name: "Amex Blue Cash Preferred",
    issuer: "Amex",
    color: "#006fcf",
    gradient: "linear-gradient(135deg, #006fcf, #00175a)",
    baseCashback: 1,
    topCategory: 6,
    annualFee: 95,
    categories: {
      grocery: 6, streaming: 6, transit: 3, gas: 3,
    },
    note: "6% at US supermarkets (up to $6k/yr), 6% streaming, 3% transit & gas",
    specialOffers: [
      { store: "Whole Foods", type: "amex_offer", value: 10, expires: "2026-05-20", desc: "Amex Offer: 10% back at Whole Foods (up to $25)" },
      { store: "Home Depot", type: "amex_offer", value: 8, expires: "2026-06-01", desc: "Amex Offer: Spend $50 get $8 back" },
      { store: "Walmart", type: "amex_offer", value: 5, expires: "2026-06-10", desc: "Amex Offer: 5% back on Walmart.com" },
    ]
  },
  {
    id: "capital_one_savor",
    name: "Capital One SavorOne",
    issuer: "Capital One",
    color: "#d03027",
    gradient: "linear-gradient(135deg, #d03027, #8b1a17)",
    baseCashback: 1,
    topCategory: 3,
    annualFee: 0,
    categories: {
      restaurants: 3, grocery: 3, entertainment: 3, streaming: 3,
    },
    note: "3% dining, grocery, entertainment, streaming. 1% everything else",
    specialOffers: [
      { store: "Target", type: "cashback_boost", value: 6, expires: "2026-05-25", desc: "Capital One Offer: 6% back at Target" },
      { store: "Costco", type: "cashback_boost", value: 4, expires: "2026-06-30", desc: "4% back at Costco" },
      { store: "Starbucks", type: "cashback_boost", value: 8, expires: "2026-05-18", desc: "8% back at Starbucks this week" },
    ]
  },
  {
    id: "discover_it",
    name: "Discover it Cash Back",
    issuer: "Discover",
    color: "#ff6600",
    gradient: "linear-gradient(135deg, #ff6600, #cc4400)",
    baseCashback: 1,
    topCategory: 5,
    annualFee: 0,
    categories: {
      restaurants: 5, grocery: 1, gas: 1,
    },
    note: "5% rotating quarterly categories, 1% everything else. First year cashback match!",
    specialOffers: [
      { store: "Target", type: "cashback_boost", value: 5, expires: "2026-06-30", desc: "Q2: 5% at Target (rotating category)" },
      { store: "Walmart", type: "cashback_boost", value: 2, expires: "2026-05-31", desc: "Discover Deal: extra 2% at Walmart" },
    ]
  },
  {
    id: "wellsfargo_active",
    name: "Wells Fargo Active Cash",
    issuer: "Wells Fargo",
    color: "#cd1409",
    gradient: "linear-gradient(135deg, #cd1409, #8b0000)",
    baseCashback: 2,
    topCategory: 2,
    annualFee: 0,
    categories: {},
    note: "Flat 2% cash rewards on all purchases. Simple and reliable.",
    specialOffers: [
      { store: "Amazon", type: "cashback_boost", value: 5, expires: "2026-06-15", desc: "WF Offer: 5% back on Amazon (up to $20)" },
    ]
  },
];

const POPULAR_STORES = [
  { name: "Walmart", icon: "🏪", category: "retail" },
  { name: "Target", icon: "🎯", category: "retail" },
  { name: "Costco", icon: "📦", category: "wholesale" },
  { name: "Amazon", icon: "📱", category: "online" },
  { name: "Whole Foods", icon: "🥑", category: "grocery" },
  { name: "Kroger", icon: "🛒", category: "grocery" },
  { name: "Home Depot", icon: "🔨", category: "home_improvement" },
  { name: "Starbucks", icon: "☕", category: "restaurants" },
  { name: "Trader Joe's", icon: "🌻", category: "grocery" },
  { name: "CVS", icon: "💊", category: "drugstores" },
  { name: "Walgreens", icon: "⚕️", category: "drugstores" },
  { name: "Lowe's", icon: "🏠", category: "home_improvement" },
  { name: "Best Buy", icon: "🖥️", category: "electronics" },
  { name: "Shell Gas", icon: "⛽", category: "gas" },
  { name: "Chipotle", icon: "🌯", category: "restaurants" },
];

function getStoreRewards(storeName, userCards) {
  const results = userCards.map(card => {
    const specialOffer = card.specialOffers.find(
      o => o.store.toLowerCase() === storeName.toLowerCase()
    );
    const store = POPULAR_STORES.find(s => s.name.toLowerCase() === storeName.toLowerCase());
    const categoryRate = store ? (card.categories[store.category] || card.baseCashback) : card.baseCashback;
    const effectiveRate = specialOffer ? Math.max(specialOffer.value, categoryRate) : categoryRate;
    return {
      card,
      baseRate: card.baseCashback,
      categoryRate,
      specialOffer,
      effectiveRate,
      hasBoost: !!specialOffer,
    };
  });
  results.sort((a, b) => b.effectiveRate - a.effectiveRate);
  return results;
}

function CardChip({ style }) {
  return (
    <div style={{
      width: 32, height: 24, borderRadius: 4,
      background: "linear-gradient(135deg, #e8d5a3 0%, #c9a84c 40%, #e8d5a3 60%, #c9a84c 100%)",
      border: "1px solid rgba(0,0,0,0.15)",
      position: "relative", overflow: "hidden", ...style
    }}>
      <div style={{ position: "absolute", top: 4, left: 4, right: 4, bottom: 4, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 2 }} />
    </div>
  );
}

function CreditCard({ card, rate, isTop, hasBoost, offer }) {
  return (
    <div style={{
      background: card.gradient,
      borderRadius: 14,
      padding: "18px 20px",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      transform: isTop ? "scale(1)" : "scale(0.97)",
      opacity: isTop ? 1 : 0.85,
      transition: "all 0.3s ease",
      boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
    }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", bottom: -40, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.8, textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>{card.issuer}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{card.name.replace(card.issuer + " ", "")}</div>
        </div>
        <div style={{
          background: isTop ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
          borderRadius: 10, padding: "6px 14px",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{rate}%</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
        <CardChip />
        <div style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.15em", opacity: 0.7 }}>•••• •••• •••• ••••</div>
      </div>

      {hasBoost && (
        <div style={{
          marginTop: 10, background: "rgba(255,255,255,0.18)", borderRadius: 8,
          padding: "6px 10px", fontSize: 11.5, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
          border: "1px solid rgba(255,255,255,0.15)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span>{offer.desc}</span>
          <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: 10 }}>exp {new Date(offer.expires).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      )}

      {isTop && (
        <div style={{
          position: "absolute", top: -1, right: 20,
          background: "#00c853", color: "#fff",
          padding: "4px 12px 6px", borderRadius: "0 0 8px 8px",
          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 2px 8px rgba(0,200,83,0.4)"
        }}>
          ★ BEST PICK
        </div>
      )}
    </div>
  );
}

function SavingsCalc({ topRate, secondRate }) {
  const [amount, setAmount] = useState(100);
  const topSave = (amount * topRate / 100).toFixed(2);
  const secondSave = (amount * secondRate / 100).toFixed(2);
  const diff = (topSave - secondSave).toFixed(2);
  return (
    <div style={{
      background: "rgba(0,200,83,0.06)", borderRadius: 14, padding: 18,
      border: "1px solid rgba(0,200,83,0.15)", marginTop: 16
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#00c853", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
        💰 Savings Calculator
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>Purchase amount:</span>
        <div style={{ display: "flex", alignItems: "center", background: "#f5f5f5", borderRadius: 8, padding: "4px 10px" }}>
          <span style={{ color: "#666", fontWeight: 600 }}>$</span>
          <input
            type="number" value={amount}
            onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
            style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: 18, fontWeight: 700, width: 80, fontFamily: "'DM Sans', sans-serif",
              color: "#222"
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 10, padding: 10, border: "1px solid #e0e0e0" }}>
          <div style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>Best card earns</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#00c853", fontFamily: "'DM Sans', sans-serif" }}>${topSave}</div>
        </div>
        {diff > 0 && (
          <div style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 10, padding: 10, border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>You save extra</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#ff6600", fontFamily: "'DM Sans', sans-serif" }}>${diff}</div>
            <div style={{ fontSize: 10, color: "#999", fontFamily: "'DM Sans', sans-serif" }}>vs 2nd best card</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [userCards, setUserCards] = useState(CARDS_DB.map(c => c.id));
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [results, setResults] = useState(null);
  const [animateResults, setAnimateResults] = useState(false);
  const inputRef = useRef(null);

  const activeCards = CARDS_DB.filter(c => userCards.includes(c.id));

  const filteredStores = POPULAR_STORES.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  function handleSelectStore(store) {
    setSelectedStore(store);
    setSearchText(store.name);
    setAnimateResults(false);
    const r = getStoreRewards(store.name, activeCards);
    setResults(r);
    setTimeout(() => setAnimateResults(true), 50);
  }

  function handleBack() {
    setSelectedStore(null);
    setSearchText("");
    setResults(null);
    setAnimateResults(false);
  }

  function toggleCard(cardId) {
    setUserCards(prev =>
      prev.includes(cardId) ? prev.filter(c => c !== cardId) : [...prev, cardId]
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafafa",
      fontFamily: "'DM Sans', sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "32px 20px 28px",
        borderRadius: "0 0 28px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,200,83,0.08)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(0,102,207,0.1)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#00c853", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                SWIPE SMART
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "4px 0 0", letterSpacing: "-0.02em" }}>
                Card Rewards Optimizer
              </h1>
            </div>
            <button
              onClick={() => setShowCardPicker(!showCardPicker)}
              style={{
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 10, padding: "8px 12px", color: "#fff", cursor: "pointer",
                fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              }}
            >
              💳 My Cards ({activeCards.length})
            </button>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "8px 0 0", lineHeight: 1.5 }}>
            Find the best card to use at any store — instantly.
          </p>
        </div>
      </div>

      {/* Card Picker Drawer */}
      {showCardPicker && (
        <div style={{
          margin: "12px 16px", background: "#fff", borderRadius: 14, padding: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #eee",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#333" }}>Select your cards:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CARDS_DB.map(card => (
              <label key={card.id} style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "8px 10px", borderRadius: 10,
                background: userCards.includes(card.id) ? "rgba(0,200,83,0.06)" : "#f9f9f9",
                border: userCards.includes(card.id) ? "1px solid rgba(0,200,83,0.2)" : "1px solid #eee",
                transition: "all 0.2s ease",
              }}>
                <input type="checkbox" checked={userCards.includes(card.id)} onChange={() => toggleCard(card.id)}
                  style={{ accentColor: "#00c853", width: 16, height: 16 }} />
                <div style={{ width: 22, height: 14, borderRadius: 3, background: card.gradient, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{card.name}</span>
                {card.annualFee > 0 && <span style={{ fontSize: 10, color: "#999", marginLeft: "auto" }}>${card.annualFee}/yr</span>}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      <div style={{ padding: "16px 16px 8px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#fff", borderRadius: 14, padding: "4px 4px 4px 16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e8e8e8",
        }}>
          {selectedStore && (
            <button onClick={handleBack} style={{
              background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1,
            }}>←</button>
          )}
          <span style={{ fontSize: 18 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Where are you shopping?"
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setSelectedStore(null); setResults(null); }}
            style={{
              flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif", padding: "12px 0", background: "transparent", color: "#222",
            }}
          />
          {searchText && (
            <button onClick={() => { setSearchText(""); setSelectedStore(null); setResults(null); }}
              style={{ background: "#eee", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Store Chips (when no store selected) */}
      {!selectedStore && (
        <div style={{ padding: "8px 16px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {searchText ? "Matching stores" : "Popular stores"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {filteredStores.map(store => (
              <button
                key={store.name}
                onClick={() => handleSelectStore(store)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#fff", border: "1px solid #e0e0e0",
                  borderRadius: 50, padding: "8px 16px",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", color: "#333",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span>{store.icon}</span>
                <span>{store.name}</span>
              </button>
            ))}
            {filteredStores.length === 0 && searchText && (
              <div style={{ padding: "20px 0", color: "#999", fontSize: 14, textAlign: "center", width: "100%" }}>
                No matching stores. Try a different name.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {selectedStore && results && (
        <div style={{ padding: "12px 16px 24px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <span style={{ fontSize: 28 }}>{selectedStore.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#222" }}>{selectedStore.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>
                Ranked by effective cashback rate
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r, i) => (
              <div
                key={r.card.id}
                style={{
                  opacity: animateResults ? 1 : 0,
                  transform: animateResults ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s`,
                }}
              >
                <CreditCard
                  card={r.card}
                  rate={r.effectiveRate}
                  isTop={i === 0}
                  hasBoost={r.hasBoost}
                  offer={r.specialOffer}
                />
              </div>
            ))}
          </div>

          {results.length >= 2 && (
            <SavingsCalc
              topRate={results[0].effectiveRate}
              secondRate={results[1].effectiveRate}
            />
          )}

          {/* Insight box */}
          <div style={{
            marginTop: 16, background: "#fff", borderRadius: 14,
            padding: 16, border: "1px solid #eee",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>💡 Smart Tip</div>
            <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              {results[0].hasBoost
                ? `Use your ${results[0].card.name} here — there's a limited-time offer giving you ${results[0].effectiveRate}% back. That's ${results[0].effectiveRate - results[0].baseRate}% above the base rate!`
                : results[0].effectiveRate > results[0].baseRate
                  ? `Your ${results[0].card.name} has a category bonus for this type of store — ${results[0].effectiveRate}% vs the ${results[0].baseRate}% base rate.`
                  : `No special offers right now. Your ${results[0].card.name} gives the best flat rate at ${results[0].effectiveRate}%.`
              }
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedStore && !searchText && (
        <div style={{ padding: "16px", textAlign: "center" }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 20px",
            border: "1px solid #eee", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏬</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 6 }}>
              Select a store to get started
            </div>
            <div style={{ fontSize: 13, color: "#999", lineHeight: 1.5 }}>
              Tap a store above or search for any retailer to instantly see which of your credit cards earns the most rewards.
            </div>
          </div>

          <div style={{
            marginTop: 16, background: "linear-gradient(135deg, #1a1a2e, #0f3460)",
            borderRadius: 16, padding: "20px", textAlign: "left", color: "#fff",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#00c853", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              HOW IT WORKS
            </div>
            {[
              { step: "1", text: "Select which credit cards you carry" },
              { step: "2", text: "Pick the store you're shopping at" },
              { step: "3", text: "See which card earns the most — including limited-time offers" },
            ].map(item => (
              <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "rgba(0,200,83,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#00c853", flexShrink: 0,
                }}>{item.step}</div>
                <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.9 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
