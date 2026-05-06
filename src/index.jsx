import { useState, useEffect, useCallback } from "react";

// ─── GOOGLE SHEETS CONFIG ─────────────────────────────────────────────────────
const CARDS_SHEET_ID  = "19xS4tywFSnMAjbSlwlsLCQRD_r08NlQq9YtJxl4wdL4";
const STORES_SHEET_ID = "1htq_G6Wa2BTERsY2x7TWFmbd0eiQbNgbPuU73x2soik";
const CSV = (id) =>
  `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`;

// ─── CLEARBIT DOMAIN MAP ──────────────────────────────────────────────────────
// Maps lowercase store names → their root domain for logo.clearbit.com lookups
const STORE_DOMAINS = {
  "walmart":        "walmart.com",
  "amazon":         "amazon.com",
  "target":         "target.com",
  "kroger":         "kroger.com",
  "costco":         "costco.com",
  "starbucks":      "starbucks.com",
  "mcdonald's":     "mcdonalds.com",
  "mcdonalds":      "mcdonalds.com",
  "shell":          "shell.com",
  "cvs":            "cvs.com",
  "whole foods":    "wholefoodsmarket.com",
  "home depot":     "homedepot.com",
  "chipotle":       "chipotle.com",
  "walgreens":      "walgreens.com",
  "trader joe's":   "traderjoes.com",
  "trader joes":    "traderjoes.com",
  "exxon":          "exxon.com",
  "lowe's":         "lowes.com",
  "lowes":          "lowes.com",
  "best buy":       "bestbuy.com",
  "publix":         "publix.com",
  "chevron":        "chevron.com",
  "panera":         "panerabread.com",
  "subway":         "subway.com",
  "chick-fil-a":    "chick-fil-a.com",
  "olive garden":   "olivegarden.com",
  "rite aid":       "riteaid.com",
  "sam's club":     "samsclub.com",
  "bj's":           "bjs.com",
  "tj maxx":        "tjmaxx.com",
  "dollar general": "dollargeneral.com",
  "dollar tree":    "dollartree.com",
  "safeway":        "safeway.com",
  "aldi":           "aldi.us",
  "sprouts":        "sprouts.com",
  "wegmans":        "wegmans.com",
  "heb":            "heb.com",
  "uber":           "uber.com",
  "lyft":           "lyft.com",
  "netflix":        "netflix.com",
  "spotify":        "spotify.com",
  "bp":             "bp.com",
  "mobil":          "mobil.com",
  "food lion":      "foodlion.com",
  "harris teeter":  "harristeeter.com",
  "meijer":         "meijer.com",
  "winn-dixie":     "winndixie.com",
};

// Brand color fallbacks for when Clearbit logo fails or domain is unknown
const STORE_BRAND = {
  "walmart":        { bg: "#0071CE", fg: "#fff",     abbr: "W"  },
  "amazon":         { bg: "#FF9900", fg: "#131921",   abbr: "a"  },
  "target":         { bg: "#CC0000", fg: "#fff",     abbr: "T"  },
  "kroger":         { bg: "#E31837", fg: "#fff",     abbr: "K"  },
  "costco":         { bg: "#005DAA", fg: "#fff",     abbr: "C"  },
  "starbucks":      { bg: "#00704A", fg: "#fff",     abbr: "S"  },
  "mcdonald's":     { bg: "#DA291C", fg: "#fff",     abbr: "M"  },
  "shell":          { bg: "#FBB731", fg: "#DD1D21",  abbr: "S"  },
  "cvs":            { bg: "#CC0000", fg: "#fff",     abbr: "C"  },
  "whole foods":    { bg: "#00674B", fg: "#fff",     abbr: "WF" },
  "home depot":     { bg: "#F96302", fg: "#fff",     abbr: "HD" },
  "chipotle":       { bg: "#441700", fg: "#fff",     abbr: "C"  },
  "walgreens":      { bg: "#E31837", fg: "#fff",     abbr: "W"  },
  "trader joe's":   { bg: "#B22222", fg: "#fff",     abbr: "TJ" },
  "exxon":          { bg: "#CC0000", fg: "#fff",     abbr: "E"  },
  "lowe's":         { bg: "#004990", fg: "#fff",     abbr: "L"  },
  "best buy":       { bg: "#0046BE", fg: "#FFE000",  abbr: "BB" },
  "publix":         { bg: "#007147", fg: "#fff",     abbr: "P"  },
  "chevron":        { bg: "#0071CE", fg: "#fff",     abbr: "CH" },
  "panera":         { bg: "#8C4A2F", fg: "#fff",     abbr: "PB" },
  "subway":         { bg: "#008C15", fg: "#fff",     abbr: "S"  },
  "chick-fil-a":    { bg: "#E4002B", fg: "#fff",     abbr: "CF" },
  "food lion":      { bg: "#E31837", fg: "#fff",     abbr: "FL" },
  "bp":             { bg: "#007A33", fg: "#fff",     abbr: "BP" },
};

function getStoreDomain(name) {
  return STORE_DOMAINS[name.toLowerCase()] || null;
}
function getStoreBrand(name) {
  return STORE_BRAND[name.toLowerCase()] || {
    bg: "#1A3A6B", fg: "#fff",
    abbr: name.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase(),
  };
}

// ─── CATEGORY CONFIG ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",              label: "All",        icon: "🏪" },
  { id: "grocery",          label: "Grocery",    icon: "🛒" },
  { id: "dining",           label: "Dining",     icon: "🍽️" },
  { id: "gas",              label: "Gas",        icon: "⛽" },
  { id: "online_retail",    label: "Online",     icon: "📦" },
  { id: "drugstore",        label: "Drugstore",  icon: "💊" },
  { id: "wholesale",        label: "Wholesale",  icon: "🏢" },
  { id: "home_improvement", label: "Home",       icon: "🔨" },
  { id: "travel",           label: "Travel",     icon: "✈️" },
];

const CAT_PICKER_OPTIONS = [
  { id: "dining",           label: "Dining",           desc: "Restaurants, fast food, cafes"   },
  { id: "grocery",          label: "Grocery",          desc: "Supermarkets, food stores"        },
  { id: "gas",              label: "Gas",              desc: "Gas stations, fuel"               },
  { id: "drugstore",        label: "Drugstore",        desc: "CVS, Walgreens, pharmacies"       },
  { id: "online_retail",    label: "Online Retail",    desc: "Amazon, online shopping"          },
  { id: "wholesale",        label: "Wholesale Club",   desc: "Costco, Sam's Club, BJ's"         },
  { id: "home_improvement", label: "Home Improvement", desc: "Home Depot, Lowe's"               },
  { id: "streaming",        label: "Streaming",        desc: "Netflix, Spotify, Disney+"        },
  { id: "entertainment",    label: "Entertainment",    desc: "Movies, concerts, events"         },
  { id: "travel",           label: "Travel",           desc: "Hotels, flights, car rental"      },
  { id: "transit",          label: "Transit",          desc: "Uber, Lyft, public transport"     },
];

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

const KW_MAP = [
  { c: "dining",           w: ["restaurant","grill","pizza","burger","taco","sushi","cafe","diner","kitchen","bbq","wings","deli","ramen","thai","chinese","mexican","steakhouse","chipotle","mcdonald","subway","panera","starbucks","chick-fil","olive garden","applebee","ihop","dunkin","domino","popeye","wendy","sonic"] },
  { c: "grocery",          w: ["grocery","supermarket","market","food lion","kroger","publix","wegman","whole food","trader joe","aldi","safeway","stop & shop","giant","heb","meijer","winn-dixie","fresh","sprout","lidl","harris teeter"] },
  { c: "gas",              w: ["gas","fuel","shell","exxon","bp","chevron","mobil","sunoco","marathon","speedway","wawa","sheetz","racetrac","circle k","quik trip"] },
  { c: "drugstore",        w: ["cvs","walgreen","rite aid","pharmacy","drug"] },
  { c: "wholesale",        w: ["costco","sam's club","bj's wholesale","bj wholesale"] },
  { c: "online_retail",    w: ["amazon","ebay","etsy","wish","online"] },
  { c: "home_improvement", w: ["home depot","lowe's","lowes","ace hardware","menards","harbor freight"] },
  { c: "streaming",        w: ["netflix","spotify","hulu","disney","hbo","peacock","paramount","apple tv","youtube premium"] },
  { c: "entertainment",    w: ["cinema","movie","amc","regal","theater","concert","ticketmaster","bowling","arcade","dave & buster"] },
  { c: "travel",           w: ["hotel","motel","marriott","hilton","hyatt","airbnb","airline","delta","united","southwest","hertz","enterprise","avis"] },
  { c: "transit",          w: ["uber","lyft","taxi","metro","transit","bart"] },
];

function detectCategory(name) {
  const n = name.toLowerCase();
  for (const { c, w } of KW_MAP) {
    if (w.some(kw => n.includes(kw))) return c;
  }
  return null;
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g,"").toLowerCase().replace(/ /g,"_"));
  return lines.slice(1).map(line => {
    const vals = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { vals.push(cur); cur = ""; }
      else cur += ch;
    }
    vals.push(cur);
    return Object.fromEntries(headers.map((h,i) => [h, (vals[i]||"").trim().replace(/^"|"$/g,"")]));
  });
}

// ─── STORE LOGO ───────────────────────────────────────────────────────────────
function StoreLogo({ name, size = 36 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const domain = getStoreDomain(name);
  const brand  = getStoreBrand(name);
  const abbr   = brand.abbr;
  const fontSize = abbr.length > 1 ? size * 0.29 : size * 0.40;

  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: brand.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)",
    }}>
      {domain && !imgFailed ? (
        <img
          src={`https://logo.clearbit.com/${domain}`}
          alt={name}
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          style={{ objectFit: "contain" }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span style={{
          color: brand.fg,
          fontWeight: 800,
          fontSize,
          fontFamily: "'DM Sans',sans-serif",
          letterSpacing: abbr.length > 1 ? "-0.5px" : "0",
          lineHeight: 1,
        }}>
          {abbr}
        </span>
      )}
    </div>
  );
}

// ─── ONBOARDING BANNER ────────────────────────────────────────────────────────
function OnboardingBanner({ onDismiss }) {
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #B5D4F4",
      borderRadius: 14, padding: "14px 14px 12px",
      marginBottom: 14, position: "relative",
    }}>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        position: "absolute", top: 10, right: 10,
        background: "#F4F6F9", border: "none", borderRadius: 6,
        width: 26, height: 26, cursor: "pointer", fontSize: 13,
        color: "#8896AA", display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 11 }}>
        <span style={{ fontSize: 15 }}>✨</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0C447C", fontFamily: "'DM Sans',sans-serif" }}>
          How to use this app
        </span>
      </div>

      {[
        { n:"1", title:"Find your store", body:"Search by name, browse by category, or tap a store tile. Can't find it? Search anyway and pick a category manually." },
        { n:"2", title:"See your best card", body:"We rank the cards you own by cashback rate for that store, instantly." },
        { n:"3", title:"Add your cards", body:"Tap My Cards below to select the cards you actually own for personalised results." },
      ].map(s => (
        <div key={s.n} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9 }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "#1A3A6B", color: "#fff",
            fontSize: 10, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1, fontFamily: "'DM Sans',sans-serif",
          }}>{s.n}</div>
          <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.45, fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ fontWeight: 700, color: "#1a2744" }}>{s.title} — </span>{s.body}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 9, paddingTop: 9, borderTop: "1px solid #E6F1FB",
        fontSize: 11, color: "#185FA5",
        display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans',sans-serif",
      }}>
        <span>ℹ️</span> This banner only shows once — dismiss it anytime
      </div>
    </div>
  );
}

// ─── CATEGORY PICKER MODAL ────────────────────────────────────────────────────
function CategoryPickerModal({ storeName, onPick, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,18,40,0.52)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "0 0 34px", width: "100%", maxWidth: 480,
        maxHeight: "82vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E0E6F0" }} />
        </div>
        <div style={{ padding: "14px 18px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>
                What type of store is this?
              </div>
              {storeName && (
                <div style={{ fontSize: 12, color: "#8896AA", marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>
                  "{storeName}" isn't in our database yet
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "#F4F6F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, color: "#BBC5D5", marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>
            Pick a category and we'll show the best card to use
          </div>
        </div>
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          {CAT_PICKER_OPTIONS.map(cat => (
            <button key={cat.id} onClick={() => onPick(cat.id)} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#F8FAFF", border: "1.5px solid #E8ECF2",
              borderRadius: 12, padding: "12px 14px", cursor: "pointer",
              textAlign: "left", fontFamily: "'DM Sans',sans-serif",
              transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#EEF4FF"; e.currentTarget.style.borderColor = "#C8DEFF"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFF"; e.currentTarget.style.borderColor = "#E8ECF2"; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2744" }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: "#8896AA", marginTop: 1 }}>{cat.desc}</div>
              </div>
              <span style={{ color: "#BBC5D5", fontSize: 20 }}>›</span>
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
  const topEarns    = (amount * topRate / 100).toFixed(2);
  const extraVs2pct = Math.max(0, amount * topRate / 100 - amount * 2 / 100).toFixed(2);
  const extraVsSec  = secondName
    ? Math.max(0, amount * topRate / 100 - amount * (secondRate || 2) / 100).toFixed(2)
    : null;

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #E8ECF2",
      borderRadius: 14, padding: "14px 14px 13px", marginBottom: 12,
    }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#4A90D9", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 11, fontFamily: "'DM Sans',sans-serif" }}>
        💰 Savings Calculator
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#8896AA", fontFamily: "'DM Sans',sans-serif" }}>Spend</span>
        <div style={{ display: "flex", alignItems: "center", background: "#F4F6F9", borderRadius: 9, padding: "6px 11px", border: "1.5px solid #E8ECF2" }}>
          <span style={{ color: "#8896AA", fontWeight: 700, fontSize: 15 }}>$</span>
          <input
            type="number"
            inputMode="decimal"
            value={rawVal}
            onChange={e => setRawVal(e.target.value)}
            onBlur={e => {
              const n = parseFloat(e.target.value);
              setRawVal(isNaN(n) || n < 0 ? "0" : String(n));
            }}
            style={{
              border: "none", background: "transparent", outline: "none",
              fontSize: 20, fontWeight: 900, width: 90,
              fontFamily: "'DM Sans',sans-serif", color: "#1a2744",
            }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        <div style={{ background: "linear-gradient(135deg,#EEF4FF,#E0EDFF)", border: "1.5px solid #C8DEFF", borderRadius: 11, padding: "11px 13px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#4A90D9", fontWeight: 600, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>Best card earns</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>${topEarns}</div>
          <div style={{ fontSize: 10, color: "#8896AA", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{topRate}% back</div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#EFFAF4,#D8F5E6)", border: "1.5px solid #B6EDD0", borderRadius: 11, padding: "11px 13px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>vs 2% baseline</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1a2744", fontFamily: "'DM Sans',sans-serif" }}>+${extraVs2pct}</div>
          <div style={{ fontSize: 10, color: "#8896AA", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>extra earned</div>
        </div>
      </div>
      {secondName && extraVsSec && Number(extraVsSec) > 0 && (
        <div style={{ marginTop: 9, fontSize: 12, color: "#8896AA", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
          <span style={{ color: "#16A34A", fontWeight: 700 }}>${extraVsSec} more</span> than {secondName}
        </div>
      )}
    </div>
  );
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────
function ResultCard({ card, rate, rank }) {
  const isTop = rank === 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: isTop ? "linear-gradient(135deg,#EEF4FF,#E8F0FF)" : "#fff",
      border: `1.5px solid ${isTop ? "#C8DEFF" : "#E8ECF2"}`,
      borderRadius: 13, padding: "12px 14px", marginBottom: 8, position: "relative",
    }}>
      {isTop && (
        <div style={{
          position: "absolute", top: -1, left: 14,
          background: "#1A3A6B", color: "#fff",
          fontSize: 9, fontWeight: 800, padding: "2px 8px",
          borderRadius: "0 0 6px 6px", letterSpacing: "0.06em", fontFamily: "'DM Sans',sans-serif",
        }}>BEST</div>
      )}
      <div style={{ width: 36, height: 22, borderRadius: 5, background: card.card_color || "#1A3A6B", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2744", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {card.issuer} {card.card_name}
        </div>
        <div style={{ fontSize: 11, color: "#8896AA", fontFamily: "'DM Sans',sans-serif" }}>
          {!card.annual_fee || card.annual_fee === "0" ? "No annual fee" : `$${card.annual_fee}/yr`}
          {card.special_tag ? ` · ${card.special_tag}` : ""}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: isTop ? "#4A90D9" : "#1a2744", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
        {rate}%
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [cards, setCards]             = useState([]);
  const [stores, setStores]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [screen, setScreen]           = useState("home");
  const [query, setQuery]             = useState("");
  const [activeCat, setActiveCat]     = useState("all");
  const [userCardIds, setUserCardIds] = useState([]);
  const [results, setResults]         = useState([]);
  const [selStore, setSelStore]       = useState(null);
  const [notFound, setNotFound]       = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [twoPct, setTwoPct]           = useState([]);
  const [animIn, setAnimIn]           = useState(false);
  const [showBanner, setShowBanner]   = useState(true);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if banner was previously dismissed
    try {
      if (localStorage.getItem("swipesmart_onboarded")) setShowBanner(false);
    } catch (_) {}

    async function load() {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(CSV(CARDS_SHEET_ID)),
          fetch(CSV(STORES_SHEET_ID)),
        ]);
        if (!cRes.ok || !sRes.ok)
          throw new Error("Could not load data. Make sure both Google Sheets are set to 'Anyone with link can view'.");
        const [cText, sText] = await Promise.all([cRes.text(), sRes.text()]);
        const parsedCards  = parseCSV(cText).filter(c => !c.active || ["yes","true","1"].includes(c.active.toLowerCase()));
        const parsedStores = parseCSV(sText);
        setCards(parsedCards);
        setStores(parsedStores);
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

  function dismissBanner() {
    setShowBanner(false);
    try { localStorage.setItem("swipesmart_onboarded","1"); } catch (_) {}
  }

  // ── Compute results from category ──────────────────────────────────────────
  const computeFromCategory = useCallback((cat, storeObj) => {
    const col = CAT_COL[cat];
    const myCards = cards.filter(c => userCardIds.includes(c.card_id));
    const ranked = myCards
      .map(c => ({ card: c, rate: parseFloat(col ? (c[col] || c.base_rate || 1) : (c.base_rate || 1)) }))
      .filter(r => !isNaN(r.rate))
      .sort((a, b) => b.rate - a.rate);
    const twoPctList = cards.filter(c =>
      (!c.annual_fee || c.annual_fee === "0") &&
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

  // ── Search handler ─────────────────────────────────────────────────────────
  function handleSearch(overrideQuery) {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q || !cards.length) return;
    setAnimIn(false);
    setNotFound(false);

    const exact = stores.find(s => s.store_name?.toLowerCase() === q.toLowerCase());
    if (exact) { computeFromCategory(exact.category?.toLowerCase(), exact); return; }

    const partial = stores.find(s => s.store_name?.toLowerCase().includes(q.toLowerCase()));
    if (partial) { computeFromCategory(partial.category?.toLowerCase(), partial); return; }

    const detected = detectCategory(q);
    if (detected) { computeFromCategory(detected, { store_name: q, category: detected }); return; }

    // Nothing matched
    setNotFound(true);
    setScreen("results");
    setResults([]);
    setSelStore({ store_name: q });
    setAnimIn(false);
  }

  function pickCat(cat) {
    computeFromCategory(cat, { store_name: selStore?.store_name || query, category: cat });
  }

  function goHome() {
    setScreen("home");
    setQuery("");
    setResults([]);
    setNotFound(false);
    setAnimIn(false);
  }

  // ── Filtered stores for tile grid ──────────────────────────────────────────
  const FALLBACK_STORES = [
    {store_name:"Walmart",category:"retail"},{store_name:"Amazon",category:"online_retail"},
    {store_name:"Kroger",category:"grocery"},{store_name:"Costco",category:"wholesale"},
    {store_name:"Target",category:"retail"},{store_name:"Starbucks",category:"dining"},
    {store_name:"McDonald's",category:"dining"},{store_name:"Shell",category:"gas"},
    {store_name:"CVS",category:"drugstore"},{store_name:"Whole Foods",category:"grocery"},
    {store_name:"Home Depot",category:"home_improvement"},{store_name:"Chipotle",category:"dining"},
  ];
  const storeSource = stores.length > 0 ? stores : FALLBACK_STORES;
  const visibleStores = activeCat === "all"
    ? storeSource.slice(0, 20)
    : storeSource.filter(s => s.category?.toLowerCase() === activeCat).slice(0, 20);

  const issuers = [...new Set(cards.map(c => c.issuer))];
  const topResult    = results[0];
  const secondResult = results[1];

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100svh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#F0F4FA", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:36, marginBottom:14 }}>💳</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#1a2744" }}>Loading your cards…</div>
      <div style={{ fontSize:12, color:"#8896AA", marginTop:6 }}>Fetching from Google Sheets</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:"100svh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:"#F0F4FA", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:36, marginBottom:14 }}>⚠️</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#1a2744", textAlign:"center", marginBottom:8 }}>Couldn't load data</div>
      <div style={{ fontSize:13, color:"#8896AA", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ background:"#1A3A6B", color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
        Try Again
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100svh", background:"#F0F4FA", fontFamily:"'DM Sans',sans-serif", maxWidth:480, margin:"0 auto", position:"relative", paddingBottom:80 }}>
      <style>{`
        html,body{background:#F0F4FA;margin:0;padding:0;}
        *{box-sizing:border-box;}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        ::-webkit-scrollbar{display:none;}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ─ HEADER ─ */}
      <div style={{ background:"linear-gradient(135deg,#1A3A6B 0%,#0d2045 60%,#1A3A6B 100%)", padding:"28px 18px 18px", borderRadius:"0 0 22px 22px", boxShadow:"0 4px 20px rgba(26,58,107,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#67C5FF", letterSpacing:"0.14em", textTransform:"uppercase" }}>Swipe Smart</div>
            <div style={{ fontSize:21, fontWeight:900, color:"#fff", marginTop:2, letterSpacing:"-0.02em" }}>Card Rewards Optimizer</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>YOUR CARDS</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{userCardIds.length}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Store name, e.g. Food Lion…"
            style={{ flex:1, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:11, padding:"10px 13px", fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#fff", outline:"none" }}
          />
          <button onClick={() => handleSearch()} style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:11, padding:"10px 16px", cursor:"pointer", fontSize:18 }}>
            🔍
          </button>
        </div>
      </div>

      {/* ─ HOME ─ */}
      {screen === "home" && (
        <div style={{ padding:"16px 15px 0" }}>

          {showBanner && <OnboardingBanner onDismiss={dismissBanner} />}

          {/* Category strip */}
          <div style={{ fontSize:10, fontWeight:700, color:"#8896AA", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:9 }}>Browse by category</div>
          <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:4, marginBottom:14, scrollbarWidth:"none" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
                flexShrink:0, background: activeCat === cat.id ? "#1A3A6B" : "#fff",
                border:`1.5px solid ${activeCat === cat.id ? "#1A3A6B" : "#E8ECF2"}`,
                borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:600,
                color: activeCat === cat.id ? "#fff" : "#4A5568",
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                transition:"all .15s",
              }}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>

          {/* Store tiles */}
          <div style={{ fontSize:10, fontWeight:700, color:"#8896AA", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>
            {activeCat === "all" ? "Popular stores" : `${CATEGORIES.find(c=>c.id===activeCat)?.label || ""} stores`}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:20 }}>
            {visibleStores.map(s => (
              <button key={s.store_name} onClick={() => handleSearch(s.store_name)} style={{
                display:"flex", alignItems:"center", gap:11,
                background:"#fff", border:"1.5px solid #E8ECF2", borderRadius:13,
                padding:"11px 12px", cursor:"pointer", textAlign:"left",
                fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#C8DEFF"; e.currentTarget.style.background="#F8FAFF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#E8ECF2"; e.currentTarget.style.background="#fff"; }}
              >
                <StoreLogo name={s.store_name} size={38} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1a2744", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {s.store_name}
                  </div>
                  <div style={{ fontSize:10, color:"#8896AA", marginTop:1, textTransform:"capitalize" }}>
                    {(s.category||"").replace(/_/g," ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─ RESULTS ─ */}
      {screen === "results" && (
        <div style={{ padding:"16px 15px 0" }}>
          {/* Back + store identity */}
          <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:14 }}>
            <button onClick={goHome} style={{ background:"#fff", border:"1.5px solid #E8ECF2", borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
            <StoreLogo name={selStore?.store_name || query} size={36} />
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#1a2744" }}>{selStore?.store_name || query}</div>
              {selStore?.category && (
                <div style={{ fontSize:11, color:"#8896AA", textTransform:"capitalize" }}>{selStore.category.replace(/_/g," ")}</div>
              )}
            </div>
          </div>

          {/* Not found */}
          {notFound && (
            <div style={{ background:"#fff", border:"1.5px solid #FDE68A", borderRadius:14, padding:16, marginBottom:14 }}>
              <div style={{ fontSize:20, marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:15, fontWeight:800, color:"#1a2744", marginBottom:4 }}>"{selStore?.store_name || query}" not found</div>
              <div style={{ fontSize:13, color:"#8896AA", lineHeight:1.5, marginBottom:14 }}>
                We don't have this store yet. Tell us what type of store it is and we'll find the best card.
              </div>
              <button onClick={() => setShowCatModal(true)} style={{ background:"#1A3A6B", color:"#fff", border:"none", borderRadius:11, padding:"12px 18px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" }}>
                📂 Pick a Category for This Store
              </button>
            </div>
          )}

          {/* Card results */}
          {results.length > 0 && (
            <>
              {results.map((r,i) => (
                <div key={r.card.card_id} style={{ opacity:animIn?1:0, transform:animIn?"translateY(0)":"translateY(18px)", transition:`opacity .3s ${i*.07}s, transform .3s cubic-bezier(.16,1,.3,1) ${i*.07}s` }}>
                  <ResultCard card={r.card} rate={r.rate} rank={i} />
                </div>
              ))}
              {topResult && (
                <div style={{ opacity:animIn?1:0, transition:"opacity .3s .28s" }}>
                  <SavingsCalc
                    topRate={topResult.rate}
                    topName={`${topResult.card.issuer} ${topResult.card.card_name}`}
                    secondRate={secondResult?.rate || 2}
                    secondName={secondResult ? `${secondResult.card.issuer} ${secondResult.card.card_name}` : null}
                  />
                </div>
              )}
              {twoPct.length > 0 && topResult && topResult.rate < 2 && (
                <div style={{ background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:13, padding:14, marginBottom:14, opacity:animIn?1:0, transition:"opacity .3s .38s" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#D97706", marginBottom:6 }}>💡 You could earn more</div>
                  <div style={{ fontSize:12, color:"#92400E", marginBottom:10, lineHeight:1.5 }}>
                    Your best card gives {topResult.rate}% here. These no-fee cards give a flat 2% everywhere:
                  </div>
                  {twoPct.map(c => (
                    <div key={c.card_id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.7)", borderRadius:9, padding:"8px 12px", marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1a2744" }}>{c.issuer} {c.card_name}</div>
                        <div style={{ fontSize:10, color:"#8896AA" }}>No annual fee</div>
                      </div>
                      <div style={{ fontSize:16, fontWeight:900, color:"#D97706" }}>2%</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─ MY CARDS ─ */}
      {screen === "manage" && (
        <div style={{ padding:"16px 15px 0" }}>
          {/* Header row with Select All / Unselect All */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:4 }}>
            <div style={{ fontSize:16, fontWeight:800, color:"#1a2744" }}>My Cards</div>
            <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:10 }}>
              <button
                onClick={() => setUserCardIds(cards.map(c => c.card_id))}
                style={{
                  background: userCardIds.length === cards.length ? "#E8ECF2" : "#1A3A6B",
                  color: userCardIds.length === cards.length ? "#8896AA" : "#fff",
                  border: "none", borderRadius:8, padding:"5px 10px",
                  fontSize:11, fontWeight:700, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
                  opacity: userCardIds.length === cards.length ? 0.5 : 1,
                }}
              >
                Select all
              </button>
              <button
                onClick={() => setUserCardIds([])}
                style={{
                  background: userCardIds.length === 0 ? "#E8ECF2" : "#fff",
                  color: userCardIds.length === 0 ? "#8896AA" : "#E24B4A",
                  border: `1.5px solid ${userCardIds.length === 0 ? "#E8ECF2" : "#FECACA"}`,
                  borderRadius:8, padding:"5px 10px",
                  fontSize:11, fontWeight:700, cursor:"pointer",
                  fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
                  opacity: userCardIds.length === 0 ? 0.5 : 1,
                }}
              >
                Unselect all
              </button>
            </div>
          </div>
          <div style={{ fontSize:12, color:"#8896AA", marginBottom:16 }}>
            {userCardIds.length} of {cards.length} cards selected
          </div>
          {issuers.map(issuer => (
            <div key={issuer} style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#8896AA", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>{issuer}</div>
              {cards.filter(c => c.issuer === issuer).map(card => {
                const on = userCardIds.includes(card.card_id);
                return (
                  <label key={card.card_id} style={{ display:"flex", alignItems:"center", gap:12, background:on?"#EEF4FF":"#fff", border:`1.5px solid ${on?"#C8DEFF":"#E8ECF2"}`, borderRadius:13, padding:"11px 13px", marginBottom:8, cursor:"pointer" }}>
                    <input type="checkbox" checked={on}
                      onChange={() => setUserCardIds(prev => on ? prev.filter(id=>id!==card.card_id) : [...prev,card.card_id])}
                      style={{ accentColor:"#1A3A6B", width:16, height:16, flexShrink:0 }}
                    />
                    <div style={{ width:28, height:18, borderRadius:4, background:card.card_color||"#1A3A6B", border:"1px solid rgba(0,0,0,0.1)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:on?"#1a2744":"#8896AA", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{card.card_name}</div>
                      <div style={{ fontSize:10, color:"#BBC5D5" }}>{!card.annual_fee||card.annual_fee==="0"?"No annual fee":`$${card.annual_fee}/yr`} · {card.base_rate}% base</div>
                    </div>
                    {card.special_tag && (
                      <span style={{ fontSize:9, fontWeight:800, color:card.card_accent||"#4A90D9", background:`${card.card_accent||"#4A90D9"}18`, padding:"3px 8px", borderRadius:5, flexShrink:0, border:`1px solid ${card.card_accent||"#4A90D9"}30` }}>
                        {card.special_tag}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ─ BOTTOM NAV ─ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(20px)", borderTop:"1.5px solid #E8ECF2", padding:"10px 15px 20px", zIndex:100, display:"flex", gap:10, maxWidth:480, margin:"0 auto", boxShadow:"0 -4px 18px rgba(0,0,0,0.06)" }}>
        {[{id:"home",label:"🏠 Home"},{id:"manage",label:"💳 My Cards"}].map(tab => (
          <button key={tab.id} onClick={() => tab.id==="home" ? goHome() : setScreen(tab.id)} style={{
            flex:1, background:screen===tab.id?"#1A3A6B":"#F4F6F9",
            border:`1.5px solid ${screen===tab.id?"#1A3A6B":"#E8ECF2"}`,
            borderRadius:12, padding:"11px 0", cursor:"pointer",
            color:screen===tab.id?"#fff":"#8896AA",
            fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
            letterSpacing:"0.06em", textTransform:"uppercase", transition:"all .2s",
            boxShadow:screen===tab.id?"0 4px 12px rgba(26,58,107,0.3)":"none",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ─ CATEGORY MODAL ─ */}
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
