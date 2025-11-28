import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Zap, Music, Coffee, MessageCircleHeart, Plane, Download, Ticket, Volume2, VolumeX } from 'lucide-react';

// --- CONFIG ---
const TARGET_SCORE = 50000;

const UPGRADES = [
  { id: 1, name: "Penser à toi", cost: 50, cps: 1, icon: <Heart className="w-4 h-4" />, desc: "+1 Bisou / seconde" },
  { id: 2, name: "Petit SMS Mignon", cost: 250, multiplier: 2, icon: <MessageCircleHeart className="w-4 h-4" />, desc: "Tes clics valent x2" },
  { id: 3, name: "Playlist Love", cost: 1000, cps: 10, icon: <Music className="w-4 h-4" />, desc: "+10 Bisous / seconde" },
  { id: 4, name: "Petit Dej au lit", cost: 5000, cps: 50, icon: <Coffee className="w-4 h-4" />, desc: "+50 Bisous / seconde" },
  { id: 5, name: "Massage du dos", cost: 15000, multiplier: 5, icon: <Sparkles className="w-4 h-4" />, desc: "Clics x5 (Détente absolue)" },
  { id: 6, name: "Week-end Surprise", cost: 30000, cps: 500, icon: <Plane className="w-4 h-4" />, desc: "+500 Bisous / seconde (WOW)" },
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

  // Musique
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. CHARGEMENT ET SYNCHRO (POLLING) ---
  const fetchData = async () => {
    try {
      const res = await fetch('/api/route'); // Assure-toi que c'est bien '/api/route' et pas '/api/sync' si ton fichier s'appelle route.ts
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      
      if (data && data.clicker) {
        // CORRECTION CRITIQUE : On ne met à jour que si le serveur a un meilleur score OU si c'est le tout premier chargement
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
      console.error("Erreur chargement clicker:", error);
    } finally {
      // IMPORTANT : On débloque le chargement quoi qu'il arrive
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    // Sauvegarde périodique toutes les 5 secondes
    const saveInterval = setInterval(saveGame, 5000);
    return () => clearInterval(saveInterval);
  }, []); // eslint-disable-line

  // --- 2. SAUVEGARDE VIA API ---
  const saveGame = async () => {
    // Ne pas sauvegarder si score vide (évite d'écraser la DB avec 0)
    if (totalAccumulated === 0) return;

    const gameState = {
      bisous, totalAccumulated, clickPower, autoBisousPerSecond, purchasedUpgrades, gameWon, chestOpened
    };
    
    try {
      await fetch('/api/route', {
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
        // Pas de save ici pour ne pas spammer, on compte sur le saveInterval
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoBisousPerSecond, gameWon]); 

  const handleMainClick = () => {
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
      
      // Force save immédiate
      setTimeout(saveGame, 50); 
    }
  };

  const handleOpenChest = () => {
      setChestOpened(true);
      setTimeout(saveGame, 50);
  };

  // Gestion Musique
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = 0.1; // Volume doux
        if (isMuted) audioRef.current.pause();
        else audioRef.current.play().catch(() => {}); // Ignorer erreur autoplay
    }
  }, [isMuted]);

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

      {/* BOUTONS NAVIGATION */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 rounded-full hover:bg-white text-gray-500 z-10">✕</button>
      <button onClick={() => setIsMuted(!isMuted)} className="absolute top-4 left-4 p-2 bg-white/50 rounded-full hover:bg-white text-gray-500 z-10">
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
                  Tu as débloqué l'ultime récompense. Va vite ouvrir le cadeau <span className="font-bold text-rose-500">BONUS</span> dans la boîte mystère.
                </p>
                <button onClick={handleOpenChest} className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl text-xl animate-pulse">
                  C'est bon, je l'ai ouvert !
                </button>
              </div>
            ) : (
              <div className="max-w-md w-full bg-indigo-900 rounded-3xl p-8 shadow-2xl border border-indigo-500 relative overflow-hidden text-white">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                 <Ticket className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                 <h3 className="text-2xl font-bold mb-2">AUPINARD EN CONCERT</h3>
                 <p className="text-indigo-200 text-sm mb-8">Ta place est réservée. Prépare-toi ! 🎶</p>
                 <a href="/ticket-aupinard.pdf" download className="flex items-center justify-center gap-3 w-full bg-white text-indigo-900 font-bold py-4 rounded-xl hover:bg-indigo-50">
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
                <div className="text-3xl font-black text-gray-800">{Math.floor(bisous).toLocaleString()} <span className="text-rose-500 text-lg">Bisous</span></div>
                <div className="text-xs text-green-500 font-bold">+{autoBisousPerSecond} / sec</div>
            </div>
            <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
                <motion.div className="h-full bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-500" initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 mix-blend-multiply uppercase">{progressPercentage >= 100 ? "MAXIMAL !" : `${Math.floor(progressPercentage)}% - Surprise en cours...`}</div>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.90 }} onClick={handleMainClick} className="relative z-10 text-rose-500 drop-shadow-2xl">
                <Heart className="w-48 h-48 fill-rose-500 stroke-rose-600" />
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
                            className={`w-full flex items-center p-3 rounded-xl border-2 transition-all text-left ${isBought ? "bg-green-50 border-green-200 opacity-80" : canBuy ? "bg-white border-rose-100" : "bg-gray-50 opacity-50 grayscale"}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isBought ? "bg-green-200" : "bg-rose-100 text-rose-500"}`}>{isBought ? "OK" : upgrade.icon}</div>
                            <div className="flex-1">
                                <div className="flex justify-between"><span className="font-bold text-sm">{upgrade.name}</span><span className={isBought ? "hidden" : "text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full"}>{upgrade.cost}</span></div>
                                <p className="text-xs text-gray-500 font-medium">{upgrade.desc}</p>
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