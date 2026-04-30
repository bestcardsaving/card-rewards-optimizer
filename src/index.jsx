import React, { useState, useEffect, useMemo } from 'react';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTw7Eqlez9794Rm_bBc5_vBxQH8HQVjK9dgqPZNHeucbCpHB-UAZpmGXMBkF9Md1PEGt8sGy7OUYPV2/pub?output=csv";

export default function CardRewardsOptimizer() {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch data from your Google Sheet on load
  useEffect(() => {
    fetch(CSV_URL)
      .then(response => response.text())
      .then(csvText => {
        const rows = csvText.split('\n').slice(1); // Skip header row
        const parsedCards = rows.map(row => {
          const [id, name, issuer, color, grocery, dining, gas, target, walmart, applyLink] = row.split(',');
          return {
            id, name, issuer, color, applyLink,
            categories: { 
              grocery: parseFloat(grocery), 
              dining: parseFloat(dining), 
              gas: parseFloat(gas),
              target: parseFloat(target),
              walmart: parseFloat(walmart)
            }
          };
        }).filter(card => card.id); // Remove empty rows
        setCards(parsedCards);
        setLoading(false);
      });
  }, []);

  // Professional Recommendation Engine
  const bestCards = useMemo(() => {
    if (!searchTerm) return cards;
    const term = searchTerm.toLowerCase();
    
    return [...cards].sort((a, b) => {
      const valA = a.categories[term] || 1;
      const valB = b.categories[term] || 1;
      return valB - valA; // Sort highest reward first
    });
  }, [searchTerm, cards]);

  if (loading) return <div className="p-8 text-center">Syncing latest rewards...</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <input 
        type="text" 
        placeholder="Where are you shopping? (e.g. Walmart)"
        className="w-full p-4 border rounded-xl shadow-sm"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {bestCards.map((card, index) => (
        <div key={card.id} className="relative p-6 rounded-2xl text-white shadow-xl" style={{ backgroundColor: card.color }}>
          {index === 0 && searchTerm && (
            <span className="absolute top-2 right-4 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
              BEST PICK
            </span>
          )}
          <h2 className="text-xl font-bold">{card.name}</h2>
          <p className="opacity-80">{card.issuer}</p>
          <div className="mt-4 text-2xl font-bold">
            {searchTerm ? `${card.categories[searchTerm.toLowerCase()] || 1}%` : "View Rewards"}
          </div>
          <a 
            href={card.applyLink} 
            className="mt-4 block w-full bg-white text-black text-center py-2 rounded-lg font-bold hover:bg-gray-100"
            target="_blank" 
            rel="noreferrer"
          >
            Apply & Get Bonus
          </a>
        </div>
      ))}
    </div>
  );
}
