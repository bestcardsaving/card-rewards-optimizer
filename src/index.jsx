import { useState, useEffect, useRef } from "react";

// ─── FULL REAL DATABASE ───────────────────────────────────────────────────────
const CARDS_DB = [
  {
    id:"chase_freedom_unlimited", name:"Freedom Unlimited", issuer:"Chase",
    fee:0, base:1.5, color:"#1A3A6B", accent:"#4A90D9",
    gradient:"linear-gradient(135deg,#1A3A6B 0%,#0D2045 60%,#1A3A6B 100%)",
    stores:{"CVS":3,"Walgreens":3,"Rite Aid":3,"Chipotle":3,"McDonalds":3,"Starbucks":3,"Chick-fil-A":3,"Olive Garden":3,"Panera":3,"Subway":3,"Taco Bell":3,"Walmart":1.5,"Target":1.5,"Costco":1.5,"Amazon":1.5,"Kroger":1.5,"Whole Foods":1.5,"Trader Joes":1.5,"Home Depot":1.5,"Lowes":1.5,"Best Buy":1.5,"Shell":1.5,"Exxon":1.5,"Chevron":1.5},
    note:"Flat 1.5% everywhere. 3% dining & drugstores.",tag:null
  },
  {
    id:"chase_freedom_flex", name:"Freedom Flex", issuer:"Chase",
    fee:0, base:1, color:"#1A3A6B", accent:"#67C5FF",
    gradient:"linear-gradient(135deg,#0D2045 0%,#1A3A6B 50%,#0D2045 100%)",
    stores:{"Amazon":5,"Whole Foods":5,"CVS":3,"Walgreens":3,"Chipotle":3,"McDonalds":3,"Starbucks":3,"Chick-fil-A":3,"Olive Garden":3,"Panera":3,"Subway":3,"Walmart":1,"Target":1,"Costco":1,"Kroger":1,"Trader Joes":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"Shell":1,"Exxon":1,"Chevron":1},
    note:"Q2 2026: 5% Amazon & Whole Foods. 3% dining & drugstores.",tag:"Q2 BOOST"
  },
  {
    id:"chase_sapphire_preferred", name:"Sapphire Preferred", issuer:"Chase",
    fee:95, base:1, color:"#1A3A6B", accent:"#A8D8FF",
    gradient:"linear-gradient(135deg,#162E54 0%,#0A1A33 60%,#162E54 100%)",
    stores:{"Chipotle":3,"McDonalds":3,"Starbucks":3,"Chick-fil-A":3,"Olive Garden":3,"Panera":3,"Subway":3,"Kroger":3,"Whole Foods":3,"Trader Joes":3,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"Shell":1,"Exxon":1,"Chevron":1,"CVS":1,"Walgreens":1},
    note:"3x dining + online grocery. Transferable points worth 25% more.",tag:null
  },
  {
    id:"citi_double_cash", name:"Double Cash", issuer:"Citi",
    fee:0, base:2, color:"#003D8F", accent:"#6EB4FF",
    gradient:"linear-gradient(135deg,#003D8F 0%,#001F55 60%,#003D8F 100%)",
    stores:{"Walmart":2,"Target":2,"Costco":2,"Amazon":2,"Kroger":2,"Whole Foods":2,"Trader Joes":2,"Home Depot":2,"Lowes":2,"Best Buy":2,"Shell":2,"Exxon":2,"Chevron":2,"CVS":2,"Walgreens":2,"Chipotle":2,"McDonalds":2,"Starbucks":2,"Chick-fil-A":2,"Olive Garden":2,"Panera":2,"Subway":2},
    note:"Flat 2% on everything. 1% when you buy + 1% when you pay.",tag:null
  },
  {
    id:"citi_custom_cash", name:"Custom Cash", issuer:"Citi",
    fee:0, base:1, color:"#003D8F", accent:"#FFD166",
    gradient:"linear-gradient(135deg,#001F55 0%,#003D8F 60%,#001F55 100%)",
    stores:{"Kroger":5,"Whole Foods":5,"Trader Joes":5,"Publix":5,"Safeway":5,"Shell":5,"Exxon":5,"Chevron":5,"BP":5,"Chipotle":5,"McDonalds":5,"Starbucks":5,"Chick-fil-A":5,"Olive Garden":5,"Panera":5,"Subway":5,"Home Depot":5,"Lowes":5,"CVS":5,"Walgreens":5,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Best Buy":1},
    note:"Auto-detects your top spend category. 5% up to $500/mo.",tag:"AUTO 5%"
  },
  {
    id:"capital_one_quicksilver", name:"Quicksilver", issuer:"Capital One",
    fee:0, base:1.5, color:"#8B0000", accent:"#FF8A8A",
    gradient:"linear-gradient(135deg,#8B0000 0%,#500000 60%,#8B0000 100%)",
    stores:{"Walmart":1.5,"Target":1.5,"Costco":1.5,"Amazon":1.5,"Kroger":1.5,"Whole Foods":1.5,"Trader Joes":1.5,"Home Depot":1.5,"Lowes":1.5,"Best Buy":1.5,"Shell":1.5,"Exxon":1.5,"Chevron":1.5,"CVS":1.5,"Walgreens":1.5,"Chipotle":1.5,"McDonalds":1.5,"Starbucks":1.5,"Chick-fil-A":1.5,"Olive Garden":1.5,"Panera":1.5,"Subway":1.5},
    note:"Flat 1.5% on all purchases. No categories, no hassle.",tag:null
  },
  {
    id:"capital_one_savorone", name:"SavorOne", issuer:"Capital One",
    fee:0, base:1, color:"#8B0000", accent:"#FFC0CB",
    gradient:"linear-gradient(135deg,#500000 0%,#8B0000 50%,#500000 100%)",
    stores:{"Kroger":3,"Whole Foods":3,"Trader Joes":3,"Publix":3,"Safeway":3,"Chipotle":3,"McDonalds":3,"Starbucks":3,"Chick-fil-A":3,"Olive Garden":3,"Panera":3,"Subway":3,"Taco Bell":3,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"Shell":1,"Exxon":1,"CVS":1,"Walgreens":1},
    note:"3% dining, grocery, entertainment, streaming.",tag:null
  },
  {
    id:"amex_blue_cash_everyday", name:"Blue Cash Everyday", issuer:"Amex",
    fee:0, base:1, color:"#006FCF", accent:"#7AC5FF",
    gradient:"linear-gradient(135deg,#006FCF 0%,#00408A 60%,#006FCF 100%)",
    stores:{"Kroger":3,"Whole Foods":3,"Trader Joes":3,"Publix":3,"Safeway":3,"Shell":3,"Exxon":3,"Chevron":3,"BP":3,"Amazon":3,"Walmart":1,"Target":1,"Costco":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"CVS":1,"Walgreens":1,"Chipotle":1,"McDonalds":1,"Starbucks":1},
    note:"3% grocery, gas, online retail. Up to $6K/yr per category.",tag:null
  },
  {
    id:"amex_blue_cash_preferred", name:"Blue Cash Preferred", issuer:"Amex",
    fee:95, base:1, color:"#006FCF", accent:"#FFD700",
    gradient:"linear-gradient(135deg,#00408A 0%,#006FCF 50%,#00408A 100%)",
    stores:{"Kroger":6,"Whole Foods":6,"Trader Joes":6,"Publix":6,"Safeway":6,"Shell":3,"Exxon":3,"Chevron":3,"BP":3,"Uber":3,"Lyft":3,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"CVS":1,"Walgreens":1,"Chipotle":1,"McDonalds":1,"Starbucks":1},
    note:"6% at supermarkets! Pays for itself at $1,600/yr in groceries.",tag:"6% GROCERY"
  },
  {
    id:"bofa_customized_cash", name:"Customized Cash", issuer:"Bank of America",
    fee:0, base:1, color:"#E31837", accent:"#FF8FAB",
    gradient:"linear-gradient(135deg,#E31837 0%,#9B0E22 60%,#E31837 100%)",
    stores:{"Kroger":2,"Whole Foods":2,"Trader Joes":2,"Costco":2,"Shell":3,"Exxon":3,"Chevron":3,"Home Depot":3,"Lowes":3,"Amazon":3,"Walmart":1,"Target":1,"Best Buy":1,"CVS":1,"Walgreens":1,"Chipotle":1,"McDonalds":1,"Starbucks":1},
    note:"You pick your 3% category: gas, online shopping, dining, travel, drugstores, or home improvement.",tag:null
  },
  {
    id:"bofa_unlimited_cash", name:"Unlimited Cash Rewards", issuer:"Bank of America",
    fee:0, base:1.5, color:"#E31837", accent:"#FFB3C0",
    gradient:"linear-gradient(135deg,#9B0E22 0%,#E31837 50%,#9B0E22 100%)",
    stores:{"Walmart":1.5,"Target":1.5,"Costco":1.5,"Amazon":1.5,"Kroger":1.5,"Whole Foods":1.5,"Trader Joes":1.5,"Home Depot":1.5,"Lowes":1.5,"Best Buy":1.5,"Shell":1.5,"Exxon":1.5,"Chevron":1.5,"CVS":1.5,"Walgreens":1.5,"Chipotle":1.5,"McDonalds":1.5,"Starbucks":1.5},
    note:"Flat 1.5% everywhere. BofA Preferred Rewards can boost to 2.62%.",tag:null
  },
  {
    id:"discover_it_cashback", name:"it Cash Back", issuer:"Discover",
    fee:0, base:1, color:"#FF6600", accent:"#FFB366",
    gradient:"linear-gradient(135deg,#FF6600 0%,#CC4400 60%,#FF6600 100%)",
    stores:{"Shell":5,"Exxon":5,"Chevron":5,"BP":5,"Home Depot":5,"Lowes":5,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Kroger":1,"Whole Foods":1,"Trader Joes":1,"CVS":1,"Walgreens":1,"Best Buy":1,"Chipotle":1,"McDonalds":1,"Starbucks":1},
    note:"Q2 2026: 5% gas & home improvement. First year: ALL cash back matched!",tag:"MATCH 1ST YR"
  },
  {
    id:"wellsfargo_active_cash", name:"Active Cash", issuer:"Wells Fargo",
    fee:0, base:2, color:"#CC0000", accent:"#FF8888",
    gradient:"linear-gradient(135deg,#CC0000 0%,#800000 60%,#CC0000 100%)",
    stores:{"Walmart":2,"Target":2,"Costco":2,"Amazon":2,"Kroger":2,"Whole Foods":2,"Trader Joes":2,"Home Depot":2,"Lowes":2,"Best Buy":2,"Shell":2,"Exxon":2,"Chevron":2,"CVS":2,"Walgreens":2,"Chipotle":2,"McDonalds":2,"Starbucks":2,"Chick-fil-A":2,"Olive Garden":2,"Panera":2,"Subway":2},
    note:"Flat 2% cash rewards on everything. Matches Citi Double Cash.",tag:null
  },
  {
    id:"wellsfargo_autograph", name:"Autograph", issuer:"Wells Fargo",
    fee:0, base:1, color:"#CC0000", accent:"#FFAAAA",
    gradient:"linear-gradient(135deg,#800000 0%,#CC0000 50%,#800000 100%)",
    stores:{"Shell":3,"Exxon":3,"Chevron":3,"BP":3,"Chipotle":3,"McDonalds":3,"Starbucks":3,"Chick-fil-A":3,"Olive Garden":3,"Panera":3,"Subway":3,"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Kroger":1,"Whole Foods":1,"Trader Joes":1,"Home Depot":1,"Lowes":1,"Best Buy":1,"CVS":1,"Walgreens":1},
    note:"3x dining, travel, gas, transit, streaming, phone plans. Underrated.",tag:null
  },
  {
    id:"usbank_cash_plus", name:"Cash+", issuer:"US Bank",
    fee:0, base:1, color:"#3B5E8C", accent:"#90B4E0",
    gradient:"linear-gradient(135deg,#3B5E8C 0%,#1E3A5F 60%,#3B5E8C 100%)",
    stores:{"Walmart":1,"Target":1,"Costco":1,"Amazon":1,"Kroger":2,"Whole Foods":2,"Trader Joes":2,"Shell":2,"Exxon":2,"Chevron":2,"Chipotle":2,"McDonalds":2,"Starbucks":2,"CVS":1,"Walgreens":1,"Home Depot":1,"Lowes":1,"Best Buy":1},
    note:"5% on 2 chosen categories + 2% on 1 everyday category. Very customizable.",tag:null
  },
];

const STORES = [
  {name:"Walmart",icon:"🏪",category:"retail"},
  {name:"Target",icon:"🎯",category:"retail"},
  {name:"Costco",icon:"📦",category:"wholesale"},
  {name:"Amazon",icon:"📦",category:"online"},
  {name:"Kroger",icon:"🛒",category:"grocery"},
  {name:"Whole Foods",icon:"🥑",category:"grocery"},
  {name:"Trader Joes",icon:"🌻",category:"grocery"},
  {name:"Home Depot",icon:"🔨",category:"home"},
  {name:"Lowes",icon:"🏠",category:"home"},
  {name:"Best Buy",icon:"🖥️",category:"electronics"},
  {name:"CVS",icon:"💊",category:"drugstore"},
  {name:"Walgreens",icon:"⚕️",category:"drugstore"},
  {name:"Shell",icon:"⛽",category:"gas"},
  {name:"Exxon",icon:"⛽",category:"gas"},
  {name:"Chevron",icon:"⛽",category:"gas"},
  {name:"Chipotle",icon:"🌯",category:"dining"},
  {name:"McDonalds",icon:"🍔",category:"dining"},
  {name:"Starbucks",icon:"☕",category:"dining"},
  {name:"Chick-fil-A",icon:"🐔",category:"dining"},
  {name:"Olive Garden",icon:"🍝",category:"dining"},
  {name:"Panera",icon:"🥖",category:"dining"},
  {name:"Subway",icon:"🥪",category:"dining"},
];

function getRankedCards(storeName, userCards) {
  return userCards
    .map(card => {
      const rate = card.stores[storeName] ?? card.base;
      return { card, rate, isBoost: (card.stores[storeName] ?? card.base) > card.base };
    })
    .sort((a,b) => b.rate - a.rate);
}

// ─── MINI CARD VISUAL ─────────────────────────────────────────────────────────
function MiniCard({ card, rate, rank }) {
  return (
    <div style={{
      background: card.gradient,
      borderRadius: 16,
      padding: "18px 20px 16px",
      position: "relative",
      overflow: "hidden",
      border: rank === 0 ? `1.5px solid ${card.accent}55` : "1.5px solid rgba(255,255,255,0.07)",
      transition: "transform .2s, box-shadow .2s",
      cursor: "default",
      boxShadow: rank === 0 ? `0 8px 32px ${card.accent}22` : "0 2px 12px rgba(0,0,0,0.3)",
    }}>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      <div style={{position:"absolute",bottom:-30,left:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.03)"}}/>

      {rank === 0 && (
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",background:card.accent,color:"#000",fontSize:9,fontWeight:800,letterSpacing:"0.12em",padding:"3px 12px 4px",borderRadius:"0 0 8px 8px",textTransform:"uppercase"}}>
          ★ BEST CARD
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop: rank===0?10:0}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2,fontFamily:"'DM Sans',sans-serif"}}>{card.issuer}</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>{card.name}</div>
          {card.fee > 0 && <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:1}}>${card.fee}/yr</div>}
        </div>
        <div style={{
          background:"rgba(0,0,0,0.35)",backdropFilter:"blur(8px)",
          borderRadius:10,padding:"6px 14px",border:"1px solid rgba(255,255,255,0.12)",
          textAlign:"center",
        }}>
          <div style={{fontSize:26,fontWeight:900,color:rank===0?card.accent:"#fff",lineHeight:1,fontFamily:"'DM Sans',sans-serif"}}>{rate}%</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:"0.06em",marginTop:1}}>BACK</div>
        </div>
      </div>

      <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{width:28,height:20,borderRadius:3,background:"linear-gradient(135deg,#e8d5a3,#c9a84c)",border:"1px solid rgba(0,0,0,0.15)"}}/>
          <div style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em"}}>•••• ••••</div>
        </div>
        {card.tag && (
          <div style={{fontSize:9,fontWeight:800,color:card.accent,background:`${card.accent}22`,padding:"3px 8px",borderRadius:5,letterSpacing:"0.08em"}}>
            {card.tag}
          </div>
        )}
      </div>

      {rank > 0 && (
        <div style={{marginTop:10,fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}>
          {card.note.slice(0,60)}…
        </div>
      )}

      {rank === 0 && (
        <div style={{marginTop:10,fontSize:11.5,color:"rgba(255,255,255,0.65)",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"8px 10px"}}>
          {card.note}
        </div>
      )}
    </div>
  );
}

// ─── STORE CHIP ───────────────────────────────────────────────────────────────
function StoreChip({ store, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(store)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex",alignItems:"center",gap:7,
        background: hovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
        border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:50,padding:"9px 16px",cursor:"pointer",
        fontSize:13,fontWeight:600,color:"#e4e4e7",
        fontFamily:"'DM Sans',sans-serif",
        transition:"all .18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <span style={{fontSize:16}}>{store.icon}</span>
      <span>{store.name}</span>
    </button>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home"); // home | results | manage
  const [selectedStore, setSelectedStore] = useState(null);
  const [search, setSearch] = useState("");
  const [userCardIds, setUserCardIds] = useState(CARDS_DB.map(c => c.id));
  const [results, setResults] = useState([]);
  const [amount, setAmount] = useState(100);
  const [animIn, setAnimIn] = useState(false);
  const searchRef = useRef(null);

  const userCards = CARDS_DB.filter(c => userCardIds.includes(c.id));

  function selectStore(store) {
    setSelectedStore(store);
    const r = getRankedCards(store.name, userCards);
    setResults(r);
    setAnimIn(false);
    setScreen("results");
    setTimeout(() => setAnimIn(true), 80);
  }

  function goHome() {
    setScreen("home");
    setSearch("");
    setSelectedStore(null);
    setResults([]);
  }

  const filtered = STORES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  // Group stores by category
  const categories = [
    {label:"🏬 Retail & Warehouse", filter:["retail","wholesale","online","electronics"]},
    {label:"🛒 Grocery", filter:["grocery"]},
    {label:"⛽ Gas Stations", filter:["gas"]},
    {label:"🍽️ Dining", filter:["dining"]},
    {label:"💊 Drugstores", filter:["drugstore"]},
    {label:"🔨 Home Improvement", filter:["home"]},
  ];

  const topCard = results[0];
  const saving = topCard ? ((topCard.rate - (results[1]?.rate || topCard.rate)) * amount / 100).toFixed(2) : 0;

  return (
    <div style={{minHeight:"100vh",background:"#080B14",color:"#e4e4e7",fontFamily:"'DM Sans',sans-serif",maxWidth:440,margin:"0 auto",position:"relative",overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap" rel="stylesheet"/>

      {/* ── BACKGROUND MESH ── */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:-200,left:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(26,58,107,0.35) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:300,right:-150,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,0,0,0.2) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-100,left:50,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,111,207,0.15) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1}}>

        {/* ════════════ HOME SCREEN ════════════ */}
        {screen === "home" && (
          <div>
            {/* Header */}
            <div style={{padding:"40px 20px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#4A90D9",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>
                    SWIPE SMART
                  </div>
                  <h1 style={{fontSize:28,fontWeight:900,margin:0,lineHeight:1.1,letterSpacing:"-0.03em",color:"#fff"}}>
                    Best Card<br/>At Any Store
                  </h1>
                  <p style={{fontSize:13,color:"#52525b",marginTop:8,lineHeight:1.5}}>
                    Find your highest-earning card instantly
                  </p>
                </div>
                <button
                  onClick={() => setScreen("manage")}
                  style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 14px",color:"#a1a1aa",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
                  💳 {userCards.length} Cards
                </button>
              </div>

              {/* Search */}
              <div style={{position:"relative",marginBottom:28}}>
                <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:18,pointerEvents:"none"}}>🔍</div>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search any store..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:14,padding:"14px 40px 14px 48px",fontSize:15,color:"#e4e4e7",
                    outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",
                    fontWeight:500,
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#a1a1aa",fontSize:14}}>✕</button>
                )}
              </div>
            </div>

            {/* Store sections */}
            <div style={{padding:"0 20px 100px"}}>
              {search ? (
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>
                    {filtered.length} results
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {filtered.map(s => <StoreChip key={s.name} store={s} onSelect={selectStore}/>)}
                    {filtered.length === 0 && (
                      <div style={{color:"#52525b",fontSize:14,padding:"20px 0",width:"100%",textAlign:"center"}}>
                        No stores found. Try a different name.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                categories.map(cat => {
                  const catStores = STORES.filter(s => cat.filter.includes(s.category));
                  if (catStores.length === 0) return null;
                  return (
                    <div key={cat.label} style={{marginBottom:24}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#52525b",letterSpacing:"0.08em",marginBottom:10}}>
                        {cat.label}
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                        {catStores.map(s => <StoreChip key={s.name} store={s} onSelect={selectStore}/>)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════ RESULTS SCREEN ════════════ */}
        {screen === "results" && selectedStore && (
          <div>
            {/* Top bar */}
            <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <button onClick={goHome} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,width:38,height:38,cursor:"pointer",color:"#e4e4e7",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
              <div>
                <div style={{fontSize:11,color:"#52525b",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase"}}>Shopping at</div>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",gap:6}}>
                  <span>{selectedStore.icon}</span>
                  <span>{selectedStore.name}</span>
                </div>
              </div>
            </div>

            {/* Cards ranked */}
            <div style={{padding:"0 20px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                {results.slice(0,5).map(({card, rate}, i) => (
                  <div key={card.id} style={{opacity:animIn?1:0,transform:animIn?"translateY(0)":"translateY(24px)",transition:`opacity .4s ${i*0.07}s, transform .4s cubic-bezier(.16,1,.3,1) ${i*0.07}s`}}>
                    <MiniCard card={card} rate={rate} rank={i}/>
                  </div>
                ))}
              </div>

              {/* Savings Calculator */}
              {topCard && (
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:18,marginBottom:24,opacity:animIn?1:0,transition:"opacity .4s .4s"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#4A90D9",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>
                    💰 Savings Calculator
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <span style={{fontSize:13,color:"#71717a"}}>Spend</span>
                    <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.07)",borderRadius:10,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.1)"}}>
                      <span style={{color:"#a1a1aa",fontWeight:700}}>$</span>
                      <input
                        type="number" value={amount}
                        onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                        style={{background:"transparent",border:"none",outline:"none",fontSize:20,fontWeight:800,color:"#fff",width:80,fontFamily:"'DM Sans',sans-serif"}}
                      />
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div style={{background:"rgba(74,144,217,0.1)",border:"1px solid rgba(74,144,217,0.2)",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
                      <div style={{fontSize:11,color:"#4A90D9",marginBottom:4}}>You earn back</div>
                      <div style={{fontSize:24,fontWeight:900,color:"#fff"}}>${(amount * topCard.rate / 100).toFixed(2)}</div>
                      <div style={{fontSize:10,color:"#52525b",marginTop:2}}>with {topCard.card.name}</div>
                    </div>
                    <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
                      <div style={{fontSize:11,color:"#10b981",marginBottom:4}}>Extra vs 2nd card</div>
                      <div style={{fontSize:24,fontWeight:900,color:"#fff"}}>${saving}</div>
                      <div style={{fontSize:10,color:"#52525b",marginTop:2}}>vs {results[1]?.card.name || "—"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* All cards rate comparison */}
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:18,marginBottom:32,opacity:animIn?1:0,transition:"opacity .4s .5s"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>
                  ALL YOUR CARDS RANKED
                </div>
                {results.map(({card, rate}, i) => (
                  <div key={card.id} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:10,marginBottom:10,borderBottom:i<results.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <div style={{width:20,textAlign:"center",fontSize:12,fontWeight:800,color:i===0?"#4A90D9":"#52525b"}}>
                      {i===0?"★":`${i+1}`}
                    </div>
                    <div style={{width:12,height:12,borderRadius:3,background:card.gradient,border:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:i===0?"#fff":"#a1a1aa",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {card.issuer} {card.name}
                      </div>
                      {card.fee > 0 && <div style={{fontSize:10,color:"#52525b"}}>${card.fee}/yr fee</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:16,fontWeight:800,color:i===0?"#4A90D9":"#71717a"}}>{rate}%</div>
                      <div style={{fontSize:10,color:"#52525b"}}>${(amount*rate/100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ MANAGE CARDS SCREEN ════════════ */}
        {screen === "manage" && (
          <div style={{padding:"20px 20px 80px"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
              <button onClick={goHome} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,width:38,height:38,cursor:"pointer",color:"#e4e4e7",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#fff"}}>My Cards</h2>
                <div style={{fontSize:12,color:"#52525b"}}>{userCards.length} cards selected</div>
              </div>
            </div>

            {["Chase","Citi","Capital One","Amex","Bank of America","Discover","Wells Fargo","US Bank"].map(issuer => {
              const issuerCards = CARDS_DB.filter(c => c.issuer === issuer);
              return (
                <div key={issuer} style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#52525b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>{issuer}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {issuerCards.map(card => {
                      const on = userCardIds.includes(card.id);
                      return (
                        <label key={card.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:on?"rgba(74,144,217,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${on?"rgba(74,144,217,0.2)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",transition:"all .2s"}}>
                          <input type="checkbox" checked={on} onChange={() => setUserCardIds(prev => on?prev.filter(id=>id!==card.id):[...prev,card.id])} style={{accentColor:"#4A90D9",width:16,height:16}}/>
                          <div style={{width:24,height:16,borderRadius:3,background:card.gradient,flexShrink:0,border:"1px solid rgba(255,255,255,0.1)"}}/>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:600,color:on?"#e4e4e7":"#71717a"}}>{card.name}</div>
                            <div style={{fontSize:11,color:"#52525b"}}>{card.fee===0?"No annual fee":`$${card.fee}/yr`} · {card.base}% base</div>
                          </div>
                          {card.tag && <span style={{fontSize:9,fontWeight:700,color:"#4A90D9",background:"rgba(74,144,217,0.15)",padding:"2px 7px",borderRadius:4}}>{card.tag}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════ BOTTOM NAV ════════════ */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"rgba(8,11,20,0.9)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.07)",padding:"12px 20px 20px",zIndex:100,display:"flex",gap:8}}>
          <button onClick={goHome} style={{flex:1,background:screen==="home"?"rgba(74,144,217,0.15)":"transparent",border:`1px solid ${screen==="home"?"rgba(74,144,217,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"10px 0",cursor:"pointer",color:screen==="home"?"#4A90D9":"#52525b",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all .2s"}}>
            🏠 Home
          </button>
          <button onClick={() => setScreen("manage")} style={{flex:1,background:screen==="manage"?"rgba(74,144,217,0.15)":"transparent",border:`1px solid ${screen==="manage"?"rgba(74,144,217,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"10px 0",cursor:"pointer",color:screen==="manage"?"#4A90D9":"#52525b",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all .2s"}}>
            💳 My Cards
          </button>
        </div>

      </div>
    </div>
  );
}
