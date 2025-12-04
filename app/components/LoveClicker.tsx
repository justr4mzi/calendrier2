import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Zap, Coffee, MessageCircleHeart, Plane, Download, Ticket, RotateCcw, Timer } from 'lucide-react';

const TARGET_SCORE = 50000; 

const UPGRADES = [
  { id: 1, name: "Penser à toi", cost: 30, cps: 2, icon: <Heart className="w-4 h-4" />, desc: "+2 B/s" },
  { id: 2, name: "Petit SMS", cost: 200, multiplier: 2, icon: <MessageCircleHeart className="w-4 h-4" />, desc: "Clics x2" },
  { id: 3, name: "Playlist Love", cost: 800, cps: 20, icon: <Ticket className="w-4 h-4" />, desc: "+20 B/s" },
  { id: 4, name: "Petit Dej", cost: 3000, cps: 100, icon: <Coffee className="w-4 h-4" />, desc: "+100 B/s" },
  { id: 5, name: "Massage", cost: 8000, multiplier: 5, icon: <Sparkles className="w-4 h-4" />, desc: "Clics x5" },
  { id: 6, name: "Week-end", cost: 12000, cps: 1000, icon: <Plane className="w-4 h-4" />, desc: "+1000 B/s" },
];

export default function LoveClicker({ onClose }: { onClose: () => void }) {
  const [bisous, setBisous] = useState(0);
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoBisousPerSecond, setAutoBisousPerSecond] = useState(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<number[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- UTILS ---
  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data && data.clicker) {
        if (isLoading || (data.clicker.totalAccumulated > totalAccumulated)) {
            setBisous(data.clicker.bisous || 0);
            setTotalAccumulated(data.clicker.totalAccumulated || 0);
            setClickPower(data.clicker.clickPower || 1);
            setAutoBisousPerSecond(data.clicker.autoBisousPerSecond || 0);
            setPurchasedUpgrades(data.clicker.purchasedUpgrades || []);
            setGameWon(data.clicker.gameWon || false);
            setChestOpened(data.clicker.chestOpened || false);
            if(data.clicker.startTime) setStartTime(data.clicker.startTime);
            if(data.clicker.endTime) setEndTime(data.clicker.endTime);
        }
      }
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const saveGame = async (reset = false) => {
    const gameState = reset ? {
        bisous: 0, totalAccumulated: 0, clickPower: 1, autoBisousPerSecond: 0, 
        purchasedUpgrades: [], gameWon: false, chestOpened: false, startTime: null, endTime: null
    } : {
        bisous, totalAccumulated, clickPower, autoBisousPerSecond, purchasedUpgrades, gameWon, chestOpened, startTime, endTime
    };
    
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_clicker', clickerState: gameState })
      });
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (gameWon) {
        if(intervalRef.current) clearInterval(intervalRef.current);
        if(timerRef.current) clearInterval(timerRef.current);
        return;
    }

    intervalRef.current = setInterval(() => {
      if (autoBisousPerSecond > 0) {
        if (!startTime) setStartTime(Date.now());
        setBisous(prev => prev + autoBisousPerSecond);
        setTotalAccumulated(prev => {
            const newVal = Math.min(prev + autoBisousPerSecond, TARGET_SCORE);
            if (newVal >= TARGET_SCORE && !gameWon) {
                setGameWon(true);
                setEndTime(Date.now());
            }
            return newVal;
        });
      }
    }, 1000);

    timerRef.current = setInterval(() => {
        if (startTime && !gameWon) {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
    }, 1000);

    return () => { 
        if (intervalRef.current) clearInterval(intervalRef.current); 
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoBisousPerSecond, gameWon, startTime]); 

  const handleRestart = async () => {
      if(!confirm("Veux-tu vraiment recommencer à zéro ? Ton temps sera effacé.")) return;
      setBisous(0); setTotalAccumulated(0); setClickPower(1); setAutoBisousPerSecond(0);
      setPurchasedUpgrades([]); setGameWon(false); setChestOpened(false);
      setStartTime(null); setEndTime(null); setElapsedTime(0);
      await saveGame(true);
  };

  const handleMainClick = (e: React.PointerEvent) => {
    e.preventDefault(); 
    
    if (!startTime) setStartTime(Date.now());

    setBisous(prev => prev + clickPower);
    setTotalAccumulated(prev => {
        const newVal = Math.min(prev + clickPower, TARGET_SCORE);
        if (newVal >= TARGET_SCORE && !gameWon) {
            setGameWon(true);
            setEndTime(Date.now());
        }
        return newVal;
    });
  };

  const buyUpgrade = (upgrade: typeof UPGRADES[0]) => {
    if (bisous >= upgrade.cost && !purchasedUpgrades.includes(upgrade.id)) {
      setBisous(prev => prev - upgrade.cost);
      setPurchasedUpgrades(prev => [...prev, upgrade.id]);
      if (upgrade.multiplier) setClickPower(prev => prev * upgrade.multiplier!);
      if (upgrade.cps) setAutoBisousPerSecond(prev => prev + upgrade.cps!);
      saveGame(); 
    }
  };

  const progressPercentage = Math.min(100, (totalAccumulated / TARGET_SCORE) * 100);
  const displayTime = gameWon && startTime && endTime 
    ? Math.floor((endTime - startTime) / 1000) 
    : elapsedTime;

  if (isLoading) return <div className="fixed inset-0 z-[100] bg-rose-50 flex items-center justify-center"><Sparkles className="animate-spin text-rose-500 w-10 h-10"/></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-100 to-indigo-100 flex flex-col items-center justify-center p-0 sm:p-4 overflow-hidden touch-none select-none">
      
      {/* HEADER SIMPLIFIÉ (PLUS DE SON) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none">
          <div className="pointer-events-auto flex gap-2">
             <div className="bg-white/80 backdrop-blur px-3 py-2 rounded-full shadow-sm border border-rose-100 flex items-center gap-2 text-rose-700 font-mono font-bold">
                 <Timer className="w-4 h-4" /> {formatTime(displayTime)}
             </div>
          </div>
          <div className="pointer-events-auto flex gap-2">
             <button onClick={handleRestart} className="p-2 bg-white/50 hover:bg-white rounded-full text-gray-600 transition-colors" title="Recommencer">
                <RotateCcw className="w-5 h-5"/>
             </button>
             <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full text-gray-600 transition-colors">✕</button>
          </div>
      </div>

      <AnimatePresence>
        {gameWon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 text-center">
            {!chestOpened ? (
              <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl border-4 border-yellow-400">
                <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-spin-slow" />
                <h2 className="text-2xl font-black text-rose-600 mb-4">BRAVO MA CHÉRIE !</h2>
                <p className="text-gray-600 mb-2">Objectif atteint en : <span className="font-bold">{formatTime(displayTime)}</span></p>
                <button onClick={() => { setChestOpened(true); saveGame(); }} className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl animate-pulse shadow-lg mt-4">OUVRIR CADEAU</button>
              </div>
            ) : (
              <div className="max-w-sm w-full bg-indigo-900 rounded-3xl p-6 shadow-2xl border border-indigo-500 relative text-white">
                 <button onClick={onClose} className="absolute top-2 right-2 text-white/50 hover:text-white p-2">✕</button>
                 <Ticket className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                 <h3 className="text-xl font-bold mb-2">CONCERT AUPINARD</h3>
                 <p className="text-indigo-200 text-sm mb-6">Ta place est là. T'es la meilleure clickeuse !</p>
                 <a href="/ticket-aupinard.pdf" download target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50">
                  <Download className="w-5 h-5" /> TÉLÉCHARGER
                 </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md flex flex-col h-full max-h-[800px] pt-16 pb-4 px-4">
        
        <div className="bg-white rounded-3xl p-5 shadow-xl mb-4 shrink-0 border border-rose-100 relative overflow-hidden">
             <div className="text-center z-10 relative mb-3">
                 <div className="text-4xl font-black text-gray-800 leading-none">
                     {Math.floor(bisous).toLocaleString()} <span className="text-rose-500 text-2xl">Bisous</span>
                 </div>
                 <div className="text-xs text-green-500 font-bold mt-1">+{autoBisousPerSecond} / seconde</div>
             </div>

             <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden relative border border-gray-300">
                <motion.div 
                    className="h-full bg-gradient-to-r from-rose-400 to-purple-500" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 drop-shadow-sm z-10">
                    <span className="bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {progressPercentage.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
            <motion.button 
                whileTap={{ scale: 0.90 }} 
                onPointerDown={handleMainClick}
                className="relative z-10 text-rose-500 drop-shadow-2xl filter cursor-pointer select-none outline-none"
                style={{ 
                    touchAction: 'none', 
                    WebkitTapHighlightColor: 'transparent'
                }} 
             >
                <Heart className="w-48 h-48 sm:w-56 sm:h-56 fill-rose-500 stroke-rose-600" strokeWidth={1.5} />
             </motion.button>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex-1 overflow-hidden flex flex-col border border-white/50 max-h-[40vh]">
             <div className="p-3 border-b border-gray-100 bg-white/50"><h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-yellow-500" /> Boutique à Bisous</h3></div>
             <div className="overflow-y-auto p-3 space-y-2" style={{ touchAction: 'pan-y' }}>
                {UPGRADES.map((upgrade) => {
                    const isBought = purchasedUpgrades.includes(upgrade.id);
                    const canBuy = bisous >= upgrade.cost && !isBought;
                    return (
                        <button key={upgrade.id} onClick={() => buyUpgrade(upgrade)} disabled={!canBuy && !isBought}
                            className={`w-full flex items-center p-2 rounded-xl border transition-all text-left ${isBought ? "bg-green-50 border-green-200 opacity-60" : canBuy ? "bg-white border-rose-100 hover:border-rose-400 shadow-sm" : "bg-gray-50 opacity-50 grayscale"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${isBought ? "bg-green-200 text-green-700" : "bg-rose-100 text-rose-500"}`}>{isBought ? "✓" : upgrade.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-gray-800 truncate pr-2">{upgrade.name}</span>
                                    {!isBought && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{upgrade.cost}</span>}
                                </div>
                                <p className="text-[10px] text-gray-500">{upgrade.desc}</p>
                            </div>
                        </button>
                    );
                })}
             </div>
        </div>
      </div>
    </div>
  );
}