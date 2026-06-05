"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';

const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

interface Review {
  user: string;
  comment: string;
  rating: number;
}

interface AppRanking {
  rank: number;
  name: string;
  category: string;
  visibility: number;
  growth: string;
  history: number[];
  recent_reviews: Review[];
  sentiment: string;
}

export default function Dashboard() {
  const [rankings, setRankings] = useState<AppRanking[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const rankRes = await fetch(`${apiBase}/api/rankings`);
        if (!rankRes.ok) {
          throw new Error(`Rankings API returned status ${rankRes.status} (${rankRes.statusText})`);
        }
        
        const catRes = await fetch(`${apiBase}/api/categories`);
        if (!catRes.ok) {
          throw new Error(`Categories API returned status ${catRes.status} (${catRes.statusText})`);
        }
        
        const rankingsData = await rankRes.json();
        if (rankingsData && rankingsData.error) {
          throw new Error(`Rankings API error: ${rankingsData.error}`);
        }
        
        const categoriesData = await catRes.json();
        if (categoriesData && categoriesData.error) {
          throw new Error(`Categories API error: ${categoriesData.error}`);
        }
        
        setRankings(Array.isArray(rankingsData) ? rankingsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setError(null);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredRankings = activeCategory === 'All' 
    ? rankings 
    : rankings.filter(r => r.category === activeCategory);

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-slate-50 p-6 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">
              INFOCREON
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-cyan-400" />
            App Store Ranking Tracker (ID 47)
          </p>
        </div>
      </header>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveCategory('All')} className={`px-4 py-1.5 text-sm rounded-full ${activeCategory === 'All' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>All Signals</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 text-sm rounded-full ${activeCategory === cat ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>{cat}</button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">Loading Data...</div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-400">Error: {error}</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-slate-800">
                <th className="p-4">Rank</th>
                <th className="p-4">Application</th>
                <th className="p-4">Visibility</th>
                <th className="p-4">Growth</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings && Array.isArray(filteredRankings) && filteredRankings.map((app) => (
                <tr key={app.rank} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                  <td className="p-4">{app.rank}</td>
                  <td className="p-4 font-bold">{app.name}</td>
                  <td className="p-4 h-16 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={app.history && Array.isArray(app.history) ? app.history.map((val, i) => ({ val, i })) : []}>
                        <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </td>
                  <td className="p-4">{app.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
