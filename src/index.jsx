import { useState, useEffect, useCallback } from "react";

// ─── GOOGLE SHEETS CONFIG ────────────────────────────────────────────────────
const CARDS_SHEET_ID  = "19xS4tywFSnMAjbSlwlsLCQRD_r08NlQq9YtJxl4wdL4";
const STORES_SHEET_ID = "1htq_G6Wa2BTERsY2x7TWFmbd0eiQbNgbPuU73x2soik";
const CSV = (id) => `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`;

// ─── CATEGORY COLUMN MAP ─────────────────────────────────────────────────────
const CAT_COL = {
  dining:"dining_rate", grocery:"grocery_rate", gas:"gas_rate",
  drugstore:"drugstore_rate", online_retail:"online_retail_rate",
  streaming:"streaming_rate", travel:"travel_rate",
  home_improvement:"home_improvement_rate", wholesale:"wholesale_rate",
  transit:"transit_rate", entertainment:"entertainment_rate",
  retail:null, electronics:null, automotive:null, fitness:null,
};

// ─── KEYWORD DETECTOR ────────────────────────────────────────────────────────
const KW = [
  {c:"dining",      w:["restaurant","grill","pizza","burger","taco","sushi","bistro","cafe","diner","kitchen","eatery","bbq","wings","deli","noodle","ramen","thai","chinese","mexican","italian","steakhouse","smokehouse","brewery","donut","bagel","sandwich","sub","seafood","boba","smoothie"]},
  {c:"grocery",     w:["grocery","supermarket","market","fresh","organic","food","natural","produce","foods","meats","bakery"]},
  {c:"gas",         w:["gas","fuel","petrol","station","exxon","shell","chevron","bp","mobil","sunoco","marathon","speedway","circle k","wawa","sheetz","kwiktrip","casey"]},
  {c:"drugstore",   w:["pharmacy","drug","cvs","walgreen","rite aid","duane reade"]},
  {c:"online_retail",w:["amazon","online",".com","ebay","etsy","wayfair","shopify"]},
  {c:"streaming",   w:["netflix","spotify","hulu","disney","paramount","peacock","hbo","youtube","tidal","pandora","streaming"]},
  {c:"home_improvement",w:["home depot","lowes","lowe's","menards","hardware","lumber","flooring","paint","furniture","ikea","ashley","pottery barn","ace hardware"]},
  {c:"travel",      w:["hotel","motel","airbnb","airline","flight","airport","car rental","hertz","avis","enterprise","marriott","hilton","hyatt","delta","united","southwest"]},
  {c:"transit",     w:["uber","lyft","taxi","metro","bus","train","amtrak","transit","rideshare","parking","toll"]},
  {c:"entertainment",w:["theater","cinema","movie","amc","regal","cinemark","concert","ticketmaster","arcade","bowling","golf","escape room","museum","zoo","aquarium","theme park","six flags","universal"]},
  {c:"fitness",     w:["gym","fitness","planet fitness","la fitness","ymca","crossfit","pilates","yoga","orange theory","crunch","equinox"]},
  {c:"wholesale",   w:["costco","sams club","sam's club","bjs","wholesale","bulk"]},
];

function detectCat(name) {
  const l = name.toLowerCase();
  for (const {c,w} of KW) if (w.some(k=>l.includes(k))) return c;
  return null;
}

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
  return lines.slice(1).map(line=>{
    const vals=[]; let cur=""; let inQ=false;
    for(const ch of line){
      if(ch==='"'){inQ=!inQ;}
      else if(ch===","&&!inQ){vals.push(cur.trim());cur="";}
      else cur+=ch;
    }
    vals.push(cur.trim());
    return Object.fromEntries(headers.map((h,i)=>[h,(vals[i]||"").replace(/^"|"$/g,"")]));
  }).filter(r=>["yes","true","TRUE","1"].includes(r.active));
}

// ─── RATE LOGIC ──────────────────────────────────────────────────────────────
function getRate(card, storeName, cat, q2) {
  if(q2 && card.rotating_q2_stores && parseFloat(card.rotating_q2_2026)>0){
    const rot = card.rotating_q2_stores.split(",").map(s=>s.trim().toLowerCase());
    const n = storeName.toLowerCase();
    if(rot.some(r=>n.includes(r)||r.includes(n))) return parseFloat(card.rotating_q2_2026);
  }
  const col = CAT_COL[cat];
  if(col && parseFloat(card[col])>0) return parseFloat(card[col]);
  return parseFloat(card.base_rate)||1;
}

function rankCards(cards, storeName, cat, selectedIds, q2) {
  return cards
    .filter(c=>selectedIds.includes(c.card_id))
    .map(c=>({card:c, rate:getRate(c,storeName,cat,q2), isBoost:getRate(c,storeName,cat,q2)>parseFloat(c.base_rate)}))
    .sort((a,b)=>b.rate-a.rate);
}

function get2PctCards(cards) {
  return cards.filter(c=>parseFloat(c.base_rate)>=2&&(c.annual_fee==="0"||c.annual_fee===""));
}

// ─── MANUAL CATEGORIES ───────────────────────────────────────────────────────
const CATS = [
  {id:"dining",icon:"🍽️",label:"Dining"},
  {id:"grocery",icon:"🛒",label:"Grocery"},
  {id:"gas",icon:"⛽",label:"Gas Station"},
  {id:"drugstore",icon:"💊",label:"Drugstore"},
  {id:"online_retail",icon:"📦",label:"Online Shopping"},
  {id:"retail",icon:"🏬",label:"General Retail"},
  {id:"home_improvement",icon:"🔨",label:"Home Improvement"},
  {id:"streaming",icon:"🎬",label:"Streaming"},
  {id:"travel",icon:"✈️",label:"Travel / Hotel"},
  {id:"transit",icon:"🚗",label:"Rideshare / Transit"},
  {id:"entertainment",icon:"🎭",label:"Entertainment"},
  {id:"fitness",icon:"💪",label:"Gym / Fitness"},
  {id:"electronics",icon:"🖥️",label:"Electronics"},
  {id:"wholesale",icon:"📦",label:"Warehouse / Wholesale"},
  {id:"automotive",icon:"🚙",label:"Auto Parts"},
];

const STORE_CATS = [
  {label:"Retail & Warehouse",  icon:"🏬", filter:["retail","wholesale","electronics","automotive"]},
  {label:"Grocery",             icon:"🛒", filter:["grocery"]},
  {label:"Gas Stations",        icon:"⛽", filter:["gas"]},
  {label:"Dining",              icon:"🍽️", filter:["dining"]},
  {label:"Drugstores",          icon:"💊", filter:["drugstore"]},
  {label:"Home Improvement",    icon:"🔨", filter:["home_improvement"]},
  {label:"Streaming & Fun",     icon:"🎬", filter:["streaming","entertainment","fitness"]},
  {label:"Travel & Transit",    icon:"✈️", filter:["travel","transit"]},
];

// ─── CREDIT CARD VISUAL ───────────────────────────────────────────────────────
function CreditCardUI({ card, rate, rank, isBoost }) {
  const col  = card.card_color  || "#1a3a6b";
  const acc  = card.card_accent || "#4a90d9";
  const grad = `linear-gradient(135deg, ${col} 0%, ${col}dd 55%, ${col}bb 100%)`;
  return (
    <div style={{
      background: grad, borderRadius: 18, padding: rank===0 ? "22px 20px 18px" : "15px 18px",
      position:"relative", overflow:"hidden",
      boxShadow: rank===0 ? `0 12px 40px ${col}55, 0 2px 8px rgba(0,0,0,0.12)` : "0 2px 12px rgba(0,0,0,0.1)",
      border: rank===0 ? `2px solid ${acc}55` : "1.5px solid rgba(255,255,255,0.15)",
      transform: rank===0 ? "scale(1.01)" : "scale(1)",
      transition:"all .2s",
    }}>
      {/* Decorative circles */}
      <div style={{position:"absolute",top:-50,right:-50,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
      <div style={{position:"absolute",bottom:-40,left:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>

      {rank===0 && (
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",background:acc,color:"#000",fontSize:9,fontWeight:900,letterSpacing:"0.14em",padding:"3px 16px 5px",borderRadius:"0 0 10px 10px",textTransform:"uppercase",whiteSpace:"nowrap",zIndex:2}}>
          ★ BEST PICK
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginTop:rank===0?10:0,position:"relative",zIndex:1}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{card.issuer}</div>
          <div style={{fontSize:rank===0?17:14,fontWeight:800,color:"#fff",lineHeight:1.2}}>{card.card_name}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:3}}>
            {card.annual_fee==="0"||card.annual_fee===""?"No annual fee":`$${card.annual_fee}/yr`}
          </div>
        </div>
        <div style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(10px)",borderRadius:12,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.15)",textAlign:"center",flexShrink:0}}>
          <div style={{fontSize:rank===0?30:24,fontWeight:900,color:rank===0?acc:"#fff",lineHeight:1}}>{rate}%</div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",marginTop:1}}>BACK</div>
        </div>
      </div>

      <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Chip */}
          <div style={{width:28,height:20,borderRadius:4,background:"linear-gradient(135deg,#e8d5a3,#c9a84c)",border:"1px solid rgba(0,0,0,0.15)"}}/>
          <div style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em"}}>•••• ••••</div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {isBoost && <span style={{fontSize:9,fontWeight:800,background:`${acc}30`,color:acc,padding:"3px 8px",borderRadius:5,border:`1px solid ${acc}44`}}>🔥 BONUS</span>}
          {card.special_tag && <span style={{fontSize:9,fontWeight:800,background:`${acc}30`,color:acc,padding:"3px 8px",borderRadius:5,border:`1px solid ${acc}44`}}>{card.special_tag}</span>}
        </div>
      </div>

      {rank===0 && card.note && (
        <div style={{marginTop:10,fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.5,background:"rgba(0,0,0,0.18)",borderRadius:10,padding:"8px 12px",position:"relative",zIndex:1}}>
          {card.note}
        </div>
      )}
    </div>
  );
}

// ─── STORE CHIP ───────────────────────────────────────────────────────────────
function StoreChip({ store, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"center",gap:6,background:hov?"#EEF4FF":"#F4F6F9",border:`1.5px solid ${hov?"#4A90D9":"#E8ECF2"}`,borderRadius:50,padding:"9px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1a2744",fontFamily:"'DM Sans',sans-serif",transition:"all .18s",transform:hov?"translateY(-1px)":"none",boxShadow:hov?"0 4px 12px rgba(74,144,217,0.15)":"0 1px 3px rgba(0,0,0,0.05)"}}>
      <span style={{fontSize:16}}>{store.icon}</span>
      <span>{store.store_name}</span>
    </button>
  );
}

// ─── CATEGORY MODAL ───────────────────────────────────────────────────────────
function CatModal({ storeName, onPick, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#1a2744"}}>What type of store is this?</div>
            <div style={{fontSize:12,color:"#8896AA",marginTop:3}}>"{storeName}" — pick the category to find your best card</div>
          </div>
          <button onClick={onClose} style={{background:"#F4F6F9",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:"#8896AA",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:"55vh",overflowY:"auto"}}>
          {CATS.map(cat=>(
            <button key={cat.id} onClick={()=>onPick(cat.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#F8FAFC",border:"1.5px solid #E8ECF2",borderRadius:12,cursor:"pointer",textAlign:"left",color:"#1a2744",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#EEF4FF";e.currentTarget.style.borderColor="#4A90D9";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#F8FAFC";e.currentTarget.style.borderColor="#E8ECF2";}}>
              <span style={{fontSize:20}}>{cat.icon}</span>
              <span style={{fontSize:12,fontWeight:600,lineHeight:1.3}}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,        setScreen]        = useState("home");
  const [allCards,      setAllCards]      = useState([]);
  const [allStores,     setAllStores]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(false);
  const [search,        setSearch]        = useState("");
  const [selStore,      setSelStore]      = useState(null);
  const [selCat,        setSelCat]        = useState(null);
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [results,       setResults]       = useState([]);
  const [cardIds,       setCardIds]       = useState([]);
  const [amount,        setAmount]        = useState(100);
  const [animIn,        setAnimIn]        = useState(false);
  const [lastSync,      setLastSync]      = useState(null);
  const q2 = true;

  const loadData = useCallback(async()=>{
    setLoading(true); setLoadError(false);
    try {
      const [cr,sr] = await Promise.all([fetch(CSV(CARDS_SHEET_ID)),fetch(CSV(STORES_SHEET_ID))]);
      const cards  = parseCSV(await cr.text());
      const stores = parseCSV(await sr.text());
      setAllCards(cards); setAllStores(stores);
      const noFee = cards.filter(c=>c.annual_fee==="0"||c.annual_fee==="").map(c=>c.card_id);
      const saved = localStorage.getItem("ss_cards_v3");
      setCardIds(saved ? JSON.parse(saved) : noFee);
      setLastSync(new Date());
    } catch(e){ setLoadError(true); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{loadData();},[loadData]);
  useEffect(()=>{ if(cardIds.length) localStorage.setItem("ss_cards_v3",JSON.stringify(cardIds)); },[cardIds]);

  const userCards = allCards.filter(c=>cardIds.includes(c.card_id));
  const twoPct    = get2PctCards(allCards);
  const userHas2  = twoPct.some(c=>cardIds.includes(c.card_id));
  const topRate   = results[0]?.rate||0;

  function doResults(store, cat){
    const r = rankCards(allCards, store.store_name, cat, cardIds, q2);
    setResults(r); setAnimIn(false); setTimeout(()=>setAnimIn(true),60);
  }

  function selectStore(store){
    setSelStore(store); setSelCat(store.category);
    doResults(store, store.category); setScreen("results");
  }

  function handleUnknown(name){
    const det = detectCat(name);
    const fake = {store_name:name,icon:"🏪",category:det||"retail"};
    setSelStore(fake); setSearch("");
    if(det){ setSelCat(det); doResults(fake,det); setScreen("results"); }
    else { setShowCatModal(true); }
  }

  function pickCat(cat){
    setShowCatModal(false); setSelCat(cat);
    doResults(selStore, cat); setScreen("results");
  }

  function goHome(){ setScreen("home"); setSearch(""); setSelStore(null); setResults([]); }

  const sl = search.toLowerCase();
  const filtStores = search
    ? allStores.filter(s=>s.store_name.toLowerCase().includes(sl)||(s.keywords||"").toLowerCase().includes(sl))
    : allStores;

  // ── GLOBAL STYLES injected once ──────────────────────────────────────────
  const globalStyles = `
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body,html,#root{margin:0;padding:0;background:#F0F4FA;min-height:100vh;}
    input::placeholder{color:#BBC5D5}
    input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#D0D7E3;border-radius:2px}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  `;

  // ── LOADING ──
  if(loading) return(
    <div style={{minHeight:"100vh",background:"#F0F4FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{globalStyles}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap" rel="stylesheet"/>
      <div style={{width:40,height:40,border:"3px solid #E0E8F4",borderTop:"3px solid #4A90D9",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#8896AA",fontSize:13,fontWeight:500}}>Syncing card data…</div>
    </div>
  );

  if(loadError) return(
    <div style={{minHeight:"100vh",background:"#F0F4FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:24,fontFamily:"'DM Sans',sans-serif",textAlign:"center"}}>
      <style>{globalStyles}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap" rel="stylesheet"/>
      <div style={{fontSize:40}}>⚠️</div>
      <div style={{color:"#1a2744",fontSize:16,fontWeight:800}}>Couldn't load card data</div>
      <div style={{color:"#8896AA",fontSize:13,maxWidth:280,lineHeight:1.6}}>Make sure both Google Sheets are shared:<br/><strong>Share → Anyone with the link → Viewer</strong></div>
      <button onClick={loadData} style={{background:"#4A90D9",border:"none",borderRadius:14,padding:"13px 32px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 16px rgba(74,144,217,0.3)"}}>Try Again</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F0F4FA",fontFamily:"'DM Sans',sans-serif",color:"#1a2744"}}>
      <style>{globalStyles}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap" rel="stylesheet"/>

      {/* ══════════════ HOME ══════════════ */}
      {screen==="home" && (
        <div style={{paddingBottom:90}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#1a2744 0%,#1A3A6B 60%,#1e4a8a 100%)",padding:"48px 20px 32px",borderRadius:"0 0 28px 28px",boxShadow:"0 8px 32px rgba(26,39,68,0.2)"}}>
            <div style={{maxWidth:480,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:"#67B0FF",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:6}}>SWIPE SMART</div>
                  <h1 style={{fontSize:28,fontWeight:900,color:"#fff",margin:0,lineHeight:1.1,letterSpacing:"-0.02em"}}>Best Card<br/>Any Store</h1>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:7}}>
                    {userCards.length} cards · {allStores.length} stores
                    {lastSync&&<span style={{marginLeft:5}}>· {lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  <button onClick={()=>setScreen("manage")} style={{background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"9px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(8px)",whiteSpace:"nowrap"}}>
                    💳 {userCards.length} Cards
                  </button>
                  <button onClick={loadData} style={{background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"2px 0"}}>
                    ↻ Refresh
                  </button>
                </div>
              </div>
              {/* Search */}
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none"}}>🔍</span>
                <input type="text" placeholder="Search any store, restaurant, gas station…"
                  value={search} onChange={e=>setSearch(e.target.value)}
                  style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:14,padding:"13px 44px 13px 44px",fontSize:14,color:"#fff",outline:"none",fontFamily:"'DM Sans',sans-serif",backdropFilter:"blur(10px)",fontWeight:500}}/>
                {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,width:26,height:26,cursor:"pointer",color:"#fff",fontSize:13}}>✕</button>}
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{padding:"20px 16px 0",maxWidth:480,margin:"0 auto"}}>
            {search ? (
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"#8896AA",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>
                  {filtStores.length} results for "{search}"
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {filtStores.map(s=>(
                    <StoreChip key={s.store_name} store={s} onClick={()=>{selectStore(s);setSearch("");}}/>
                  ))}
                </div>
                {filtStores.length===0&&(
                  <div style={{textAlign:"center",paddingTop:40}}>
                    <div style={{fontSize:40,marginBottom:12}}>🏪</div>
                    <div style={{fontSize:15,fontWeight:700,color:"#1a2744",marginBottom:4}}>"{search}" isn't in our list yet</div>
                    <div style={{fontSize:13,color:"#8896AA",marginBottom:20,lineHeight:1.5}}>We'll detect the category automatically<br/>and find your best card</div>
                    <button onClick={()=>handleUnknown(search)}
                      style={{background:"#4A90D9",border:"none",borderRadius:14,padding:"13px 28px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 16px rgba(74,144,217,0.3)"}}>
                      Find best card for "{search}" →
                    </button>
                  </div>
                )}
                {filtStores.length>0&&filtStores.length<=3&&(
                  <button onClick={()=>handleUnknown(search)}
                    style={{marginTop:12,background:"#EEF4FF",border:"1.5px solid #C8DEFF",borderRadius:12,padding:"11px 16px",color:"#4A90D9",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>
                    Use "{search}" as a custom store →
                  </button>
                )}
              </div>
            ) : (
              STORE_CATS.map(sc=>{
                const stores = allStores.filter(s=>sc.filter.includes(s.category));
                if(!stores.length) return null;
                return (
                  <div key={sc.label} style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                      <span style={{fontSize:14}}>{sc.icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:"#8896AA",letterSpacing:"0.06em",textTransform:"uppercase"}}>{sc.label}</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {stores.map(s=><StoreChip key={s.store_name} store={s} onClick={()=>selectStore(s)}/>)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════ RESULTS ══════════════ */}
      {screen==="results"&&selStore&&(
        <div style={{paddingBottom:90}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#1a2744 0%,#1A3A6B 60%,#1e4a8a 100%)",padding:"48px 20px 24px",borderRadius:"0 0 28px 28px",boxShadow:"0 8px 32px rgba(26,39,68,0.2)"}}>
            <div style={{maxWidth:480,margin:"0 auto"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
                <button onClick={goHome} style={{background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:10,width:38,height:38,cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,backdropFilter:"blur(8px)"}}>←</button>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>
                    {CATS.find(c=>c.id===selCat)?.icon} {CATS.find(c=>c.id===selCat)?.label||selCat}
                  </div>
                  <div style={{fontSize:20,fontWeight:900,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:22}}>{selStore.icon}</span>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selStore.store_name}</span>
                  </div>
                </div>
                <button onClick={()=>setShowCatModal(true)} style={{background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:10,padding:"7px 11px",color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0,whiteSpace:"nowrap",backdropFilter:"blur(8px)"}}>
                  ✏️ Category
                </button>
              </div>
            </div>
          </div>

          <div style={{padding:"20px 16px 0",maxWidth:480,margin:"0 auto"}}>
            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              {results.slice(0,4).map(({card,rate,isBoost},i)=>(
                <div key={card.card_id} style={{opacity:animIn?1:0,transform:animIn?"none":"translateY(18px)",transition:`opacity .35s ${i*.07}s, transform .4s cubic-bezier(.16,1,.3,1) ${i*.07}s`}}>
                  <CreditCardUI card={card} rate={rate} rank={i} isBoost={isBoost}/>
                </div>
              ))}
            </div>

            {/* 2% floor suggestion */}
            {!userHas2&&topRate<2&&twoPct.length>0&&(
              <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:16,padding:16,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:800,color:"#D97706",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>💡 You Could Earn More</div>
                <div style={{fontSize:13,color:"#78350F",lineHeight:1.6,marginBottom:10}}>
                  Your best card gives <strong>{topRate}%</strong> here. These $0-fee cards give a flat <strong>2% everywhere</strong>:
                </div>
                {twoPct.map(c=>(
                  <div key={c.card_id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.6)",borderRadius:10,padding:"10px 14px",marginBottom:6,border:"1px solid #FDE68A"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1a2744"}}>{c.issuer} {c.card_name}</div>
                      <div style={{fontSize:11,color:"#8896AA"}}>No annual fee · {c.reward_type}</div>
                    </div>
                    <div style={{fontSize:18,fontWeight:900,color:"#D97706"}}>2%</div>
                  </div>
                ))}
              </div>
            )}

            {/* Savings calc */}
            {results[0]&&(
              <div style={{background:"#fff",border:"1.5px solid #E8ECF2",borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#4A90D9",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>💰 Savings Calculator</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <span style={{fontSize:13,color:"#8896AA",fontWeight:500}}>Spend</span>
                  <div style={{display:"flex",alignItems:"center",background:"#F4F6F9",borderRadius:10,padding:"8px 14px",border:"1.5px solid #E8ECF2"}}>
                    <span style={{color:"#8896AA",fontWeight:700,fontSize:16}}>$</span>
                    <input type="number" value={amount} onChange={e=>setAmount(Math.max(1,Number(e.target.value)))}
                      style={{background:"transparent",border:"none",outline:"none",fontSize:22,fontWeight:900,color:"#1a2744",width:80,fontFamily:"'DM Sans',sans-serif"}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div style={{background:"linear-gradient(135deg,#EEF4FF,#E0EDFF)",border:"1.5px solid #C8DEFF",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#4A90D9",fontWeight:600,marginBottom:3}}>You earn back</div>
                    <div style={{fontSize:24,fontWeight:900,color:"#1a2744"}}>${(amount*results[0].rate/100).toFixed(2)}</div>
                    <div style={{fontSize:10,color:"#8896AA",marginTop:2}}>{results[0].rate}% · {results[0].card.card_name}</div>
                  </div>
                  <div style={{background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)",border:"1.5px solid #A7F3D0",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#059669",fontWeight:600,marginBottom:3}}>Yearly est.</div>
                    <div style={{fontSize:24,fontWeight:900,color:"#1a2744"}}>${(amount*results[0].rate/100*52).toFixed(0)}</div>
                    <div style={{fontSize:10,color:"#8896AA",marginTop:2}}>at ${amount}/week</div>
                  </div>
                </div>
              </div>
            )}

            {/* All cards list */}
            <div style={{background:"#fff",border:"1.5px solid #E8ECF2",borderRadius:16,padding:16,marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#8896AA",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>ALL YOUR CARDS RANKED</div>
              {results.map(({card,rate,isBoost},i)=>(
                <div key={card.card_id} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:10,marginBottom:10,borderBottom:i<results.length-1?"1.5px solid #F4F6F9":"none"}}>
                  <div style={{width:20,textAlign:"center",fontSize:12,fontWeight:800,color:i===0?"#4A90D9":"#BBC5D5",flexShrink:0}}>{i===0?"★":`${i+1}`}</div>
                  <div style={{width:12,height:12,borderRadius:3,background:`${card.card_color||"#ccc"}`,flexShrink:0,border:"1px solid rgba(0,0,0,0.08)"}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:i===0?"#1a2744":"#8896AA",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {card.issuer} {card.card_name}{isBoost&&<span style={{marginLeft:5,fontSize:10}}>🔥</span>}
                    </div>
                    <div style={{fontSize:10,color:"#BBC5D5"}}>{card.annual_fee==="0"||card.annual_fee===""?"No fee":`$${card.annual_fee}/yr`}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:900,color:i===0?"#4A90D9":"#BBC5D5"}}>{rate}%</div>
                    <div style={{fontSize:10,color:"#BBC5D5"}}>${(amount*rate/100).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MY CARDS ══════════════ */}
      {screen==="manage"&&(
        <div style={{paddingBottom:90}}>
          <div style={{background:"linear-gradient(135deg,#1a2744 0%,#1A3A6B 60%,#1e4a8a 100%)",padding:"48px 20px 24px",borderRadius:"0 0 28px 28px",boxShadow:"0 8px 32px rgba(26,39,68,0.2)"}}>
            <div style={{maxWidth:480,margin:"0 auto",display:"flex",alignItems:"center",gap:12}}>
              <button onClick={goHome} style={{background:"rgba(255,255,255,0.15)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:10,width:38,height:38,cursor:"pointer",color:"#fff",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,backdropFilter:"blur(8px)"}}>←</button>
              <div>
                <h2 style={{margin:0,fontSize:22,fontWeight:900,color:"#fff"}}>My Cards</h2>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>{userCards.length} of {allCards.length} selected</div>
              </div>
            </div>
          </div>

          <div style={{padding:"20px 16px 0",maxWidth:480,margin:"0 auto"}}>
            <div style={{background:"#EEF4FF",border:"1.5px solid #C8DEFF",borderRadius:12,padding:"12px 16px",marginBottom:18,fontSize:12,color:"#1a2744",lineHeight:1.6}}>
              📊 Add/edit cards in your <strong style={{color:"#4A90D9"}}>Google Sheet</strong>, then tap ↻ Refresh on the home screen to sync.
            </div>

            {["Chase","Citi","Capital One","American Express","Bank of America","Discover","Wells Fargo","US Bank","PNC","Synchrony/Chase","TD Bank","Navy Federal"].map(issuer=>{
              const cards = allCards.filter(c=>c.issuer===issuer);
              if(!cards.length) return null;
              return (
                <div key={issuer} style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#8896AA",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{issuer}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {cards.map(card=>{
                      const on = cardIds.includes(card.card_id);
                      return (
                        <label key={card.card_id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:on?"#EEF4FF":"#fff",border:`1.5px solid ${on?"#4A90D9":"#E8ECF2"}`,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",transition:"all .15s"}}>
                          <input type="checkbox" checked={on}
                            onChange={()=>setCardIds(prev=>on?prev.filter(id=>id!==card.card_id):[...prev,card.card_id])}
                            style={{accentColor:"#4A90D9",width:16,height:16,flexShrink:0}}/>
                          <div style={{width:24,height:16,borderRadius:4,background:`${card.card_color||"#ccc"}`,flexShrink:0,border:"1px solid rgba(0,0,0,0.1)"}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:on?"#1a2744":"#8896AA",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{card.card_name}</div>
                            <div style={{fontSize:10,color:"#BBC5D5"}}>
                              {card.annual_fee==="0"||card.annual_fee===""?"No annual fee":`$${card.annual_fee}/yr`} · {card.base_rate}% base
                            </div>
                          </div>
                          {card.special_tag&&(
                            <span style={{fontSize:9,fontWeight:800,color:card.card_accent||"#4A90D9",background:`${card.card_accent||"#4A90D9"}18`,padding:"3px 8px",borderRadius:5,flexShrink:0,border:`1px solid ${card.card_accent||"#4A90D9"}30`}}>
                              {card.special_tag}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ BOTTOM NAV ══ */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",borderTop:"1.5px solid #E8ECF2",padding:"10px 16px 20px",zIndex:100,display:"flex",gap:10,maxWidth:"100%",boxShadow:"0 -4px 20px rgba(0,0,0,0.06)"}}>
        {[{id:"home",label:"🏠 Home"},{id:"manage",label:"💳 My Cards"}].map(tab=>(
          <button key={tab.id}
            onClick={()=>tab.id==="home"?goHome():setScreen(tab.id)}
            style={{flex:1,background:screen===tab.id?"#1A3A6B":"#F4F6F9",border:`1.5px solid ${screen===tab.id?"#1A3A6B":"#E8ECF2"}`,borderRadius:12,padding:"11px 0",cursor:"pointer",color:screen===tab.id?"#fff":"#8896AA",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase",transition:"all .2s",boxShadow:screen===tab.id?"0 4px 12px rgba(26,58,107,0.3)":"none"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category modal */}
      {showCatModal&&(
        <CatModal storeName={selStore?.store_name||""} onPick={pickCat} onClose={()=>setShowCatModal(false)}/>
      )}
    </div>
  );
}
