import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Zap, Music, Coffee, MessageCircleHeart, Plane, Download, Ticket, Volume2, VolumeX } from 'lucide-react';

// --- CONFIGURATION ÉQUILIBRÉE (Plus facile & Rapide) ---
const TARGET_SCORE = 50000; // Réduit de 50k à 15k pour que ce soit moins long

const UPGRADES = [
  // J'ai baissé les prix et augmenté la puissance pour que ça aille vite !
  { id: 1, name: "Penser à toi", cost: 30, cps: 2, icon: <Heart className="w-4 h-4" />, desc: "+2 Bisous / sec" },
  { id: 2, name: "Petit SMS Mignon", cost: 200, multiplier: 2, icon: <MessageCircleHeart className="w-4 h-4" />, desc: "Clics x2 (Efficace)" },
  { id: 3, name: "Playlist Love", cost: 800, cps: 20, icon: <Music className="w-4 h-4" />, desc: "+20 Bisous / sec" },
  { id: 4, name: "Petit Dej au lit", cost: 3000, cps: 100, icon: <Coffee className="w-4 h-4" />, desc: "+100 Bisous / sec" },
  { id: 5, name: "Massage du dos", cost: 8000, multiplier: 5, icon: <Sparkles className="w-4 h-4" />, desc: "Clics x5 (Ça grimpe !)" },
  { id: 6, name: "Week-end Surprise", cost: 12000, cps: 1000, icon: <Plane className="w-4 h-4" />, desc: "+1000 Bisous / sec (La fusée 🚀)" },
];

export default function LoveClicker({ onClose }: { onClose: () => void }) {
  // États locaux
  const [bisous, setBisous] = useState(0);
  const [totalAccumulated, setTotalAccumulated] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoBisousPerSecond, setAutoBisousPerSecond] = useState(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<number[]>([]);
  
  const [gameWon, setGameWon] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Musique : On démarre en MUET pour éviter le bug du navigateur
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. CHARGEMENT ET SYNCHRO ---
  const fetchData = async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      
      if (data && data.clicker) {
        // On charge si le serveur a un score plus élevé (synchro multi-appareils)
        if (isLoading || (data.clicker.totalAccumulated > totalAccumulated)) {
            setBisous(data.clicker.bisous || 0);
            setTotalAccumulated(data.clicker.totalAccumulated || 0);
            setClickPower(data.clicker.clickPower || 1);
            setAutoBisousPerSecond(data.clicker.autoBisousPerSecond || 0);
            setPurchasedUpgrades(data.clicker.purchasedUpgrades || []);
            setGameWon(data.clicker.gameWon || false);
            setChestOpened(data.clicker.chestOpened || false);
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    const saveInterval = setInterval(saveGame, 5000);
    return () => clearInterval(saveInterval);
  }, []); // eslint-disable-line

  // --- 2. SAUVEGARDE ---
  const saveGame = async () => {
    if (totalAccumulated === 0) return;

    const gameState = {
      bisous, totalAccumulated, clickPower, autoBisousPerSecond, purchasedUpgrades, gameWon, chestOpened
    };
    
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_clicker',
          clickerState: gameState
        })
      });
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  };

  const debouncedSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveGame, 2000); 
  };

  // --- 3. LOGIQUE JEU ---
  useEffect(() => {
    if (gameWon) return;
    intervalRef.current = setInterval(() => {
      if (autoBisousPerSecond > 0) {
        setBisous(prev => prev + autoBisousPerSecond);
        setTotalAccumulated(prev => {
            const newVal = Math.min(prev + autoBisousPerSecond, TARGET_SCORE);
            if (newVal >= TARGET_SCORE && !gameWon) setGameWon(true);
            return newVal;
        });
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoBisousPerSecond, gameWon]); 

const handleMainClick = (e: any) => {
    // Empêche le zoom sur mobile quand on tape vite
    if (e && e.cancelable) e.preventDefault();

    setBisous(prev => prev + clickPower);
    setTotalAccumulated(prev => {
        const newVal = Math.min(prev + clickPower, TARGET_SCORE);
        if (newVal >= TARGET_SCORE && !gameWon) setGameWon(true);
        return newVal;
    });
    debouncedSave();
  };
  const buyUpgrade = (upgrade: typeof UPGRADES[0]) => {
    if (bisous >= upgrade.cost && !purchasedUpgrades.includes(upgrade.id)) {
      setBisous(prev => prev - upgrade.cost);
      setPurchasedUpgrades(prev => [...prev, upgrade.id]);
      if (upgrade.multiplier) setClickPower(prev => prev * upgrade.multiplier!);
      if (upgrade.cps) setAutoBisousPerSecond(prev => prev + upgrade.cps!);
      
      setTimeout(saveGame, 50); 
    }
  };

  const handleOpenChest = () => {
      setChestOpened(true);
      setTimeout(saveGame, 50);
  };

  // GESTION MUSIQUE (CORRIGÉE)
  const toggleMusic = () => {
    if (audioRef.current) {
        if (isMuted) {
            // Si c'était muet, on active et ON LANCE la lecture (interaction utilisateur)
            audioRef.current.volume = 0.02;
            audioRef.current.play().catch(e => console.log("Erreur lecture", e));
            setIsMuted(false);
        } else {
            audioRef.current.pause();
            setIsMuted(true);
        }
    }
  };

  // --- RENDER ---
  const progressPercentage = Math.min(100, (totalAccumulated / TARGET_SCORE) * 100);

  if (isLoading) return (
    <div className="fixed inset-0 z-[100] bg-rose-50 flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-rose-600 font-bold">Chargement de l'usine...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-rose-100 to-indigo-100 flex flex-col items-center justify-center p-4">
      
      {/* LECTEUR AUDIO */}
      <audio ref={audioRef} src="/lofi.mp3" loop />

      {/* BOUTON FERMER */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 rounded-full hover:bg-white text-gray-500 z-10 transition-all">✕</button>
      
      {/* BOUTON MUSIQUE (CORRIGÉ) */}
      <button 
        onClick={toggleMusic} 
        className={`absolute top-4 left-4 p-2 rounded-full z-10 transition-all ${isMuted ? 'bg-white/50 text-gray-500' : 'bg-rose-500 text-white shadow-lg animate-pulse'}`}
      >
        {isMuted ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
      </button>

      {/* MODAL FIN */}
      <AnimatePresence>
        {gameWon && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center"
          >
            {!chestOpened ? (
              <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border-4 border-yellow-400">
                <Sparkles className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-spin-slow" />
                <h2 className="text-3xl font-black text-rose-600 mb-6">FÉLICITATIONS MA CHÉRIE !</h2>
                <p className="text-gray-700 text-lg mb-8 font-medium">
                  Tu as explosé le score ! L'ultime récompense est débloquée. Ouvre vite le cadeau <span className="font-bold text-rose-500">BONUS</span>.
                </p>
                <button onClick={handleOpenChest} className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-xl animate-pulse shadow-lg hover:scale-105 transition-transform">
                  C'est bon, je l'ai ouvert !
                </button>
              </div>
            ) : (
              <div className="max-w-md w-full bg-indigo-900 rounded-3xl p-8 shadow-2xl border border-indigo-500 relative overflow-hidden text-white">
                <button 
                   onClick={onClose}
                   className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all z-20"
                >
                   ✕
                </button>
                {/* --------------------------- */}
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                 <Ticket className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                 <h3 className="text-2xl font-bold mb-2">AUPINARD EN CONCERT</h3>
                 <p className="text-indigo-200 text-sm mb-8">Ta place est réservée. Prépare-toi ! 🎶</p>
                 <a 
                   href="/ticket-aupinard.pdf" 
                   download="Ticket-Aupinard.pdf"
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-3 w-full bg-white text-indigo-900 font-bold py-4 rounded-xl hover:bg-indigo-50"
                 >
                  <Download className="w-6 h-6" /> TÉLÉCHARGER MA PLACE
                 </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* JEU */}
      <div className="w-full max-w-md flex flex-col h-full max-h-[800px]">
        <div className="bg-white rounded-3xl p-6 shadow-xl mb-4 shrink-0">
            <div className="flex justify-between items-end mb-2">
                <div className="text-3xl font-black text-gray-800 tabular-nums">{Math.floor(bisous).toLocaleString()} <span className="text-rose-500 text-lg">Bisous</span></div>
                <div className="text-xs text-green-500 font-bold">+{autoBisousPerSecond} / sec</div>
            </div>
            <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
                <motion.div className="h-full bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-500" initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 mix-blend-multiply uppercase">{progressPercentage >= 100 ? "AMOUR MAXIMAL !" : `${Math.floor(progressPercentage)}%`}</div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
<motion.button 
                whileTap={{ scale: 0.90 }} 
                // C'est ICI la magie pour le SPAM :
                onMouseDown={handleMainClick}
                onTouchStart={handleMainClick}
                className="relative z-10 text-rose-500 drop-shadow-2xl filter touch-manipulation cursor-pointer select-none outline-none"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
             >
                <Heart className="w-48 h-48 fill-rose-500 stroke-rose-600" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-xl drop-shadow-md">CLICK</span>
                </div>
             </motion.button>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-t-3xl shadow-xl flex-1 overflow-hidden flex flex-col border-t border-white/50">
             <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Boutique</h3></div>
             <div className="overflow-y-auto p-4 space-y-3 pb-20">
                {UPGRADES.map((upgrade) => {
                    const isBought = purchasedUpgrades.includes(upgrade.id);
                    const canBuy = bisous >= upgrade.cost && !isBought;
                    return (
                        <button key={upgrade.id} onClick={() => buyUpgrade(upgrade)} disabled={!canBuy && !isBought}
                            className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left ${isBought ? "bg-green-50 border-green-200 opacity-80" : canBuy ? "bg-white border-rose-100 hover:border-rose-400 shadow-sm" : "bg-gray-50 opacity-50 grayscale"}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isBought ? "bg-green-200 text-green-700" : "bg-rose-100 text-rose-500"}`}>{isBought ? "OK" : upgrade.icon}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-gray-800">{upgrade.name}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBought ? "hidden" : "bg-rose-100 text-rose-600"}`}>{upgrade.cost}</span>
                                </div>
                                <p className="text-xs text-gray-600 font-medium">{upgrade.desc}</p>
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