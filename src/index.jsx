import { useState, useEffect, useCallback } from "react";

// ─── GOOGLE SHEETS CONFIG ────────────────────────────────────────────────────
const CARDS_SHEET_ID  = "19xS4tywFSnMAjbSlwlsLCQRD_r08NlQq9YtJxl4wdL4";
const STORES_SHEET_ID = "1htq_G6Wa2BTERsY2x7TWFmbd0eiQbNgbPuU73x2soik";
const CSV = (id) =>
  `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`;

// ─── CATEGORY → COLUMN MAPPING ───────────────────────────────────────────────
const CAT_COL = {
  dining:           "dining_rate",
  grocery:          "grocery_rate",
  gas:              "gas_rate",
  drugstore:        "drugstore_rate",
  online_retail:    "online_retail_rate",
  streaming:        "streaming_rate",
  travel:           "travel_rate",
  home_improvement: "home_improvement_rate",
  wholesale:        "wholesale_rate",
  transit:          "transit_rate",
  entertainment:    "entertainment_rate",
};

// ─── CATEGORY LABELS (for picker) ────────────────────────────────────────────
const CATEGORIES = [
  { id: "dining",           label: "🍽️ Dining",           desc: "Restaurants, fast food, cafes" },
  { id: "grocery",          label: "🛒 Grocery",          desc: "Supermarkets, food stores" },
  { id: "gas",              label: "⛽ Gas",               desc: "Gas stations, fuel" },
  { id: "drugstore",        label: "💊 Drugstore",        desc: "CVS, Walgreens, pharmacies" },
  { id: "online_retail",    label: "📦 Online Retail",    desc: "Amazon, online shopping" },
  { id: "wholesale",        label: "🏪 Wholesale Club",   desc: "Costco, Sam's Club, BJ's" },
  { id: "home_improvement", label: "🔨 Home Improvement", desc: "Home Depot, Lowe's" },
  { id: "streaming",        label: "📺 Streaming",        desc: "Netflix, Spotify, Disney+" },
  { id: "entertainment",    label: "🎬 Entertainment",    desc: "Movies, concerts, events" },
  { id: "travel",           label: "✈️ Travel",           desc: "Hotels, flights, car rental" },
  { id: "transit",          label: "🚇 Transit",          desc: "Uber, Lyft, public transport" },
  { id: "gas",              label: "🛍️ General Retail",   desc: "Department stores, clothing" },
];

// ─── KEYWORD AUTO-DETECT ─────────────────────────────────────────────────────
const KW_MAP = [
  { c: "dining",           w: ["restaurant","grill","pizza","burger","taco","sushi","cafe","diner","kitchen","bbq","wings","deli","noodle","ramen","thai","chinese","mexican","steakhouse","chipotle","mcdonald","subway","panera","starbucks","chick-fil","olive garden","applebee","chili","ihop","waffle","dunkin","domino","popeye","wendy","arby","sonic"] },
  { c: "grocery",          w: ["grocery","supermarket","market","food lion","kroger","publix","wegman","whole food","trader joe","aldi","safeway","stop & shop","giant","heb","meijer","winn-dixie","fresh","sprout","natural grocers","lidl"] },
  { c: "gas",              w: ["gas","fuel","shell","exxon","bp","chevron","mobil","sunoco","marathon","phillips 66","valero","speedway","wawa","sheetz","racetrac","circle k","quik trip","qt"] },
  { c: "drugstore",        w: ["cvs","walgreen","rite aid","pharmacy","drug"] },
  { c: "wholesale",        w: ["costco","sam's club","bj's wholesale","bj wholesale"] },
  { c: "online_retail",    w: ["amazon","ebay","etsy","wish","shopify","online"] },
  { c: "home_improvement", w: ["home depot","lowe's","lowes","ace hardware","menards","harbor freight","fastenal"] },
  { c: "streaming",        w: ["netflix","spotify","hulu","disney","hbo","peacock","paramount","apple tv","youtube premium","pandora","tidal"] },
  { c: "entertainment",    w: ["cinema","movie","amc","regal","theater","theatre","concert","ticketmaster","stubhub","live nation","bowling","arcade","dave & buster"] },
  { c: "travel",           w: ["hotel","motel","marriott","hilton","hyatt","ihg","airbnb","vrbo","airline","delta","united","american airlines","southwest","hertz","enterprise","avis","budget rent"] },
  { c: "transit",          w: ["uber","lyft","taxi","metro","mta","transit","bart","wmata","septa","mbta"] },
];

function detectCategory(name) {
  const n = name.toLowerCase();
  for (const { c, w } of KW_MAP) {
    if (w.some(kw => n.includes(kw))) return c;
  }
  return null;
}

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/ /g,"_"));
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { vals.push(cur); cur = ""; }
      else cur += ch;
    }
    vals.push(cur);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || "").trim().replace(/^"|"$/g, "")]));
  });
}

// ─── CATEGORY PICKER MODAL ────────────────────────────────────────────────────
function CategoryPickerModal({ storeName, onPick, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,18,40,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "0 0 32px", width: "100%", maxWidth: 480,
        maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E0E6F0" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>
                What type of store is this?
              </div>
              {storeName && (
                <div style={{ fontSize: 13, color: "#8896AA", marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>
                  "{storeName}" isn't in our database yet
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "#F4F6F9", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: "#BBC5D5", marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>
            Pick a category and we'll show the best card to use
          </div>
        </div>

        {/* Category grid */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "dining",           label: "🍽️ Dining",           desc: "Restaurants, fast food, cafes" },
            { id: "grocery",          label: "🛒 Grocery",          desc: "Supermarkets, food stores" },
            { id: "gas",              label: "⛽ Gas",               desc: "Gas stations, fuel" },
            { id: "drugstore",        label: "💊 Drugstore",        desc: "CVS, Walgreens, pharmacies" },
            { id: "online_retail",    label: "📦 Online Retail",    desc: "Amazon, online shopping" },
            { id: "wholesale",        label: "🏪 Wholesale Club",   desc: "Costco, Sam's Club, BJ's" },
            { id: "home_improvement", label: "🔨 Home Improvement", desc: "Home Depot, Lowe's" },
            { id: "streaming",        label: "📺 Streaming",        desc: "Netflix, Spotify, Disney+" },
            { id: "entertainment",    label: "🎬 Entertainment",    desc: "Movies, concerts, events" },
            { id: "travel",           label: "✈️ Travel",           desc: "Hotels, flights, car rental" },
            { id: "transit",          label: "🚇 Transit",          desc: "Uber, Lyft, public transport" },
          ].map(cat => (
            <button key={cat.id} onClick={() => onPick(cat.id)} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#F8FAFF", border: "1.5px solid #E8ECF2",
              borderRadius: 14, padding: "13px 16px", cursor: "pointer",
              textAlign: "left", transition: "all .15s", fontFamily: "'DM Sans',sans-serif",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#EEF4FF"; e.currentTarget.style.borderColor = "#C8DEFF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFF"; e.currentTarget.style.borderColor = "#E8ECF2"; }}
            >
              <span style={{ fontSize: 22 }}>{cat.label.split(" ")[0]}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>
                  {cat.label.split(" ").slice(1).join(" ")}
                </div>
                <div style={{ fontSize: 11, color: "#8896AA", marginTop: 1 }}>{cat.desc}</div>
              </div>
              <div style={{ marginLeft: "auto", color: "#BBC5D5", fontSize: 16 }}>›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SAVINGS CALCULATOR ───────────────────────────────────────────────────────
function SavingsCalc({ topRate, topName, secondRate, secondName }) {
  const [rawVal, setRawVal] = useState("100");
  const amount = parseFloat(rawVal) || 0;

  const topEarns   = (amount * topRate   / 100).toFixed(2);
  const secEarns   = (amount * secondRate / 100).toFixed(2);
  const extraVs2pct = Math.max(0, amount * topRate / 100 - amount * 2 / 100).toFixed(2);
  const extraVsSec  = Math.max(0, amount * topRate / 100 - amount * secondRate / 100).toFixed(2);

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #E8ECF2", borderRadius: 16,
      padding: "16px 16px 14px", marginBottom: 14,
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#4A90D9", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>
        💰 Savings Calculator
      </div>

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#8896AA", fontWeight: 500, fontFamily: "'DM Sans',sans-serif" }}>Spend</span>
        <div style={{
          display: "flex", alignItems: "center",
          background: "#F4F6F9", borderRadius: 10,
          padding: "7px 12px", border: "1.5px solid #E8ECF2",
        }}>
          <span style={{ color: "#8896AA", fontWeight: 700, fontSize: 16 }}>$</span>
          <input
            type="number"
            inputMode="decimal"
            value={rawVal}
            onChange={e => setRawVal(e.target.value)}
            onBlur={e => {
              // On blur: clamp to 0 minimum, keep empty→0
              const n = parseFloat(e.target.value);
              setRawVal(isNaN(n) || n < 0 ? "0" : String(n));
            }}
            style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: 22, fontWeight: 900, width: 90,
              fontFamily: "'DM Sans',sans-serif", color: "#1a2744",
            }}
          />
        </div>
      </div>

      {/* Results grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          background: "linear-gradient(135deg,#EEF4FF,#E0EDFF)",
          border: "1.5px solid #C8DEFF", borderRadius: 12,
          padding: "12px 14px", textAlign: "center",
        }}>
          <div style={{ fontSize: 10, color: "#4A90D9", fontWeight: 600, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>Best card earns</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>${topEarns}</div>
          <div style={{ fontSize: 10, color: "#8896AA", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{topName}</div>
        </div>
        <div style={{
          background: "linear-gradient(135deg,#EFFAF4,#D8F5E6)",
          border: "1.5px solid #B6EDD0", borderRadius: 12,
          padding: "12px 14px", textAlign: "center",
        }}>
          <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>vs 2% baseline</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>+${extraVs2pct}</div>
          <div style={{ fontSize: 10, color: "#8896AA", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>extra earned</div>
        </div>
      </div>

      {secondName && Number(extraVsSec) > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#8896AA", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
          <span style={{ color: "#16A34A", fontWeight: 700 }}>${extraVsSec} more</span> than {secondName} (${secEarns})
        </div>
      )}
    </div>
  );
}

// ─── CARD CHIP ────────────────────────────────────────────────────────────────
function CardChip({ card, rate, rank }) {
  const isTop = rank === 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: isTop ? "linear-gradient(135deg,#EEF4FF,#E8F0FF)" : "#fff",
      border: `1.5px solid ${isTop ? "#C8DEFF" : "#E8ECF2"}`,
      borderRadius: 14, padding: "12px 14px", marginBottom: 8,
      boxShadow: isTop ? "0 2px 16px rgba(74,144,217,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
      position: "relative",
    }}>
      {isTop && (
        <div style={{
          position: "absolute", top: -1, left: 14,
          background: "#4A90D9", color: "#fff", fontSize: 9,
          fontWeight: 800, padding: "2px 8px", borderRadius: "0 0 6px 6px",
          letterSpacing: "0.06em", fontFamily: "'DM Sans',sans-serif",
        }}>BEST</div>
      )}
      {/* Card color swatch */}
      <div style={{
        width: 36, height: 24, borderRadius: 5,
        background: card.card_color || "#1A3A6B",
        border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {card.issuer} {card.card_name}
        </div>
        <div style={{ fontSize: 11, color: "#8896AA", fontFamily: "'DM Sans',sans-serif" }}>
          {card.annual_fee === "0" || !card.annual_fee ? "No annual fee" : `$${card.annual_fee}/yr`}
          {card.special_tag ? ` · ${card.special_tag}` : ""}
        </div>
      </div>
      <div style={{
        fontSize: 20, fontWeight: 900, color: isTop ? "#4A90D9" : "#1a2744",
        fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
      }}>
        {rate}%
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [cards, setCards]           = useState([]);
  const [stores, setStores]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [screen, setScreen]         = useState("home");   // home | results | manage
  const [query, setQuery]           = useState("");
  const [userCardIds, setUserCardIds] = useState([]);
  const [results, setResults]       = useState([]);
  const [selStore, setSelStore]     = useState(null);
  const [notFound, setNotFound]     = useState(false);    // store-not-found banner
  const [showCatModal, setShowCatModal] = useState(false);
  const [twoPct, setTwoPct]         = useState([]);
  const [animIn, setAnimIn]         = useState(false);

  // ── Load sheets ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [cRes, sRes] = await Promise.all([fetch(CSV(CARDS_SHEET_ID)), fetch(CSV(STORES_SHEET_ID))]);
        if (!cRes.ok || !sRes.ok) throw new Error("Could not load data. Make sure both Google Sheets are set to 'Anyone with link can view'.");
        const [cText, sText] = await Promise.all([cRes.text(), sRes.text()]);
        const parsedCards  = parseCSV(cText).filter(c => c.active === "yes" || c.active === "true" || c.active === "1" || !c.active);
        const parsedStores = parseCSV(sText);
        setCards(parsedCards);
        setStores(parsedStores);
        // Default: all $0-fee cards selected
        const freeIds = parsedCards.filter(c => !c.annual_fee || c.annual_fee === "0").map(c => c.card_id);
        setUserCardIds(freeIds);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Compute results from a category ───────────────────────────────────────
  const computeFromCategory = useCallback((cat, storeObj) => {
    const col = CAT_COL[cat];
    const myCards = cards.filter(c => userCardIds.includes(c.card_id));
    let ranked;
    if (col) {
      ranked = myCards
        .map(c => ({ card: c, rate: parseFloat(c[col] || c.base_rate || 1) }))
        .filter(r => !isNaN(r.rate))
        .sort((a, b) => b.rate - a.rate);
    } else {
      ranked = myCards
        .map(c => ({ card: c, rate: parseFloat(c.base_rate || 1) }))
        .sort((a, b) => b.rate - a.rate);
    }
    const twoPctList = cards.filter(c =>
      (c.annual_fee === "0" || !c.annual_fee) &&
      parseFloat(c.base_rate || 0) >= 2 &&
      !userCardIds.includes(c.card_id)
    );
    setTwoPct(twoPctList);
    setResults(ranked);
    setSelStore(storeObj || { store_name: query, category: cat });
    setShowCatModal(false);
    setNotFound(false);
    setScreen("results");
    setTimeout(() => setAnimIn(true), 50);
  }, [cards, userCardIds, query]);

  // ── Handle search ──────────────────────────────────────────────────────────
  function handleSearch() {
    if (!query.trim() || !cards.length) return;
    setAnimIn(false);
    setNotFound(false);

    // 1. Exact match in stores sheet
    const match = stores.find(s => s.store_name?.toLowerCase() === query.trim().toLowerCase());
    if (match) {
      const cat = match.category?.toLowerCase();
      computeFromCategory(cat, match);
      return;
    }

    // 2. Partial match
    const partial = stores.find(s => s.store_name?.toLowerCase().includes(query.trim().toLowerCase()));
    if (partial) {
      const cat = partial.category?.toLowerCase();
      computeFromCategory(cat, partial);
      return;
    }

    // 3. Keyword auto-detect
    const detected = detectCategory(query.trim());
    if (detected) {
      computeFromCategory(detected, null);
      return;
    }

    // 4. Not found → show banner + button
    setNotFound(true);
    setScreen("results");
    setResults([]);
    setSelStore({ store_name: query.trim() });
    setAnimIn(false);
  }

  function pickCat(cat) {
    computeFromCategory(cat, { store_name: query.trim(), category: cat });
  }

  function goHome() {
    setScreen("home");
    setQuery("");
    setResults([]);
    setNotFound(false);
    setAnimIn(false);
  }

  // ── Grouped card manage ────────────────────────────────────────────────────
  const issuers = [...new Set(cards.map(c => c.issuer))];

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F0F4FA", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>💳</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2744" }}>Loading your cards…</div>
      <div style={{ fontSize: 12, color: "#8896AA", marginTop: 6 }}>Fetching from Google Sheets</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#F0F4FA", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2744", textAlign: "center", marginBottom: 8 }}>Couldn't load data</div>
      <div style={{ fontSize: 13, color: "#8896AA", textAlign: "center", lineHeight: 1.5, marginBottom: 20 }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        Try Again
      </button>
    </div>
  );

  const topResult = results[0];
  const secondResult = results[1];

  return (
    <div style={{ minHeight: "100svh", background: "#F0F4FA", fontFamily: "'DM Sans',sans-serif", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 80 }}>
      <style>{`
        html, body { background: #F0F4FA; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg,#1A3A6B 0%,#0d2045 60%,#1A3A6B 100%)",
        padding: "28px 20px 22px", borderRadius: "0 0 24px 24px",
        boxShadow: "0 4px 20px rgba(26,58,107,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#67C5FF", letterSpacing: "0.14em", textTransform: "uppercase" }}>SWIPE SMART</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 2, letterSpacing: "-0.02em" }}>Card Rewards Optimizer</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>YOUR CARDS</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{userCardIds.length}</div>
          </div>
        </div>
      </div>

      {/* ── HOME SCREEN ── */}
      {screen === "home" && (
        <div style={{ padding: "20px 16px 0" }}>
          {/* Search box */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1.5px solid #E8ECF2" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", marginBottom: 10 }}>Where are you shopping?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Walmart, Food Lion, Shell…"
                style={{
                  flex: 1, border: "1.5px solid #E8ECF2", borderRadius: 12,
                  padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans',sans-serif",
                  outline: "none", color: "#1a2744", background: "#F8FAFF",
                }}
              />
              <button onClick={handleSearch} style={{
                background: "#1A3A6B", border: "none", borderRadius: 12,
                padding: "10px 16px", cursor: "pointer", fontSize: 18,
                boxShadow: "0 4px 12px rgba(26,58,107,0.3)",
              }}>🔍</button>
            </div>
          </div>

          {/* Quick stores */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8896AA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Quick Select</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {(stores.length > 0 ? stores.slice(0, 16) : [
              {store_name:"Walmart"},{store_name:"Amazon"},{store_name:"Target"},{store_name:"Kroger"},
              {store_name:"Costco"},{store_name:"Starbucks"},{store_name:"McDonald's"},{store_name:"Shell"},
              {store_name:"CVS"},{store_name:"Home Depot"},{store_name:"Chipotle"},{store_name:"Whole Foods"},
            ]).map(s => (
              <button key={s.store_name} onClick={() => { setQuery(s.store_name); handleSearch(); }} style={{
                background: "#fff", border: "1.5px solid #E8ECF2", borderRadius: 20,
                padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#1a2744",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EEF4FF"; e.currentTarget.style.borderColor = "#C8DEFF"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#E8ECF2"; }}
              >
                {s.store_name}
              </button>
            ))}
          </div>

          {/* Tips */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 16, border: "1.5px solid #E8ECF2", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4A90D9", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>💡 How It Works</div>
            {[
              ["Search any store", "Type a store name or pick from quick select"],
              ["Get instant result", "We find the best card you own for that store"],
              ["Manage your cards", "Add or remove cards in My Cards tab"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4A90D9", marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744" }}>{title}</div>
                  <div style={{ fontSize: 11, color: "#8896AA" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS SCREEN ── */}
      {screen === "results" && (
        <div style={{ padding: "16px 16px 0" }}>
          {/* Back + store name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={goHome} style={{
              background: "#fff", border: "1.5px solid #E8ECF2", borderRadius: 10,
              width: 36, height: 36, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>←</button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1a2744" }}>{selStore?.store_name || query}</div>
              {selStore?.category && (
                <div style={{ fontSize: 11, color: "#8896AA", textTransform: "capitalize" }}>
                  {selStore.category.replace("_", " ")} category
                </div>
              )}
            </div>
          </div>

          {/* ── NOT FOUND BANNER ── */}
          {notFound && (
            <div style={{
              background: "#fff", border: "1.5px solid #FDE68A", borderRadius: 16,
              padding: 18, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>
                "{query}" not found
              </div>
              <div style={{ fontSize: 13, color: "#8896AA", lineHeight: 1.5, marginBottom: 14 }}>
                We don't have this store in our database yet. Tell us what type of store it is and we'll find the best card to use.
              </div>
              <button onClick={() => setShowCatModal(true)} style={{
                background: "#1A3A6B", color: "#fff", border: "none",
                borderRadius: 12, padding: "12px 20px", fontSize: 14,
                fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                width: "100%", boxShadow: "0 4px 12px rgba(26,58,107,0.3)",
              }}>
                📂 Pick a Category for This Store
              </button>
            </div>
          )}

          {/* ── RESULTS ── */}
          {results.length > 0 && (
            <>
              {results.map((r, i) => (
                <div key={r.card.card_id} style={{
                  opacity: animIn ? 1 : 0,
                  transform: animIn ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity .35s ${i * 0.07}s, transform .35s cubic-bezier(.16,1,.3,1) ${i * 0.07}s`,
                }}>
                  <CardChip card={r.card} rate={r.rate} rank={i} />
                </div>
              ))}

              {/* Savings Calculator */}
              {topResult && (
                <div style={{
                  opacity: animIn ? 1 : 0,
                  transition: "opacity .35s .3s",
                }}>
                  <SavingsCalc
                    topRate={topResult.rate}
                    topName={`${topResult.card.issuer} ${topResult.card.card_name}`}
                    secondRate={secondResult?.rate || 2}
                    secondName={secondResult ? `${secondResult.card.issuer} ${secondResult.card.card_name}` : null}
                  />
                </div>
              )}

              {/* 2% tip */}
              {twoPct.length > 0 && topResult && topResult.rate < 2 && (
                <div style={{
                  background: "#FFFBEB", border: "1.5px solid #FDE68A",
                  borderRadius: 14, padding: 14, marginBottom: 14,
                  opacity: animIn ? 1 : 0, transition: "opacity .35s .4s",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>
                    💡 Earn More — Consider These Cards
                  </div>
                  <div style={{ fontSize: 12, color: "#92400E", marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>
                    Your best card gives {topResult.rate}% here. These no-fee cards give a flat 2% everywhere:
                  </div>
                  {twoPct.map(c => (
                    <div key={c.card_id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "rgba(255,255,255,0.7)", borderRadius: 10,
                      padding: "8px 12px", marginBottom: 6, border: "1px solid #FDE68A",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>{c.issuer} {c.card_name}</div>
                        <div style={{ fontSize: 10, color: "#8896AA", fontFamily: "'DM Sans',sans-serif" }}>No annual fee</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#D97706", fontFamily: "'DM Sans',sans-serif" }}>2%</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MY CARDS SCREEN ── */}
      {screen === "manage" && (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", marginBottom: 4 }}>My Cards</div>
          <div style={{ fontSize: 12, color: "#8896AA", marginBottom: 16 }}>
            Toggle the cards you own. Only selected cards are compared.
          </div>
          {issuers.map(issuer => (
            <div key={issuer} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#8896AA", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{issuer}</div>
              {cards.filter(c => c.issuer === issuer).map(card => {
                const on = userCardIds.includes(card.card_id);
                return (
                  <label key={card.card_id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: on ? "#EEF4FF" : "#fff",
                    border: `1.5px solid ${on ? "#C8DEFF" : "#E8ECF2"}`,
                    borderRadius: 14, padding: "11px 14px", marginBottom: 8,
                    cursor: "pointer", transition: "all .15s",
                  }}>
                    <input
                      type="checkbox" checked={on}
                      onChange={() => setUserCardIds(prev =>
                        on ? prev.filter(id => id !== card.card_id) : [...prev, card.card_id]
                      )}
                      style={{ accentColor: "#1A3A6B", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{
                      width: 28, height: 18, borderRadius: 4,
                      background: card.card_color || "#1A3A6B",
                      border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: on ? "#1a2744" : "#8896AA", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {card.card_name}
                      </div>
                      <div style={{ fontSize: 10, color: "#BBC5D5", fontFamily: "'DM Sans',sans-serif" }}>
                        {!card.annual_fee || card.annual_fee === "0" ? "No annual fee" : `$${card.annual_fee}/yr`} · {card.base_rate}% base
                      </div>
                    </div>
                    {card.special_tag && (
                      <span style={{
                        fontSize: 9, fontWeight: 800,
                        color: card.card_accent || "#4A90D9",
                        background: `${card.card_accent || "#4A90D9"}18`,
                        padding: "3px 8px", borderRadius: 5, flexShrink: 0,
                        border: `1px solid ${card.card_accent || "#4A90D9"}30`,
                        fontFamily: "'DM Sans',sans-serif",
                      }}>{card.special_tag}</span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── BOTTOM NAV (2 tabs only — no Sheets tab) ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
        borderTop: "1.5px solid #E8ECF2", padding: "10px 16px 20px",
        zIndex: 100, display: "flex", gap: 10,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        maxWidth: 480, margin: "0 auto",
      }}>
        {[
          { id: "home",   label: "🏠 Home" },
          { id: "manage", label: "💳 My Cards" },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => tab.id === "home" ? goHome() : setScreen(tab.id)}
            style={{
              flex: 1,
              background: screen === tab.id ? "#1A3A6B" : "#F4F6F9",
              border: `1.5px solid ${screen === tab.id ? "#1A3A6B" : "#E8ECF2"}`,
              borderRadius: 12, padding: "11px 0", cursor: "pointer",
              color: screen === tab.id ? "#fff" : "#8896AA",
              fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif",
              letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all .2s",
              boxShadow: screen === tab.id ? "0 4px 12px rgba(26,58,107,0.3)" : "none",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CATEGORY PICKER MODAL ── */}
      {showCatModal && (
        <CategoryPickerModal
          storeName={selStore?.store_name || query}
          onPick={pickCat}
          onClose={() => setShowCatModal(false)}
        />
      )}
    </div>
  );
}
