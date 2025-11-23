"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import GameLauncher from './components/games/GameLauncher';
import { Heart, Lock, Unlock, Gift, Sparkles, LogOut, RefreshCcw, Volume2, VolumeX, X, Play, Pause, Eye, Clock, Smartphone, Monitor, Send, MessageCircleHeart, Youtube, Ticket, Briefcase, Pill } from 'lucide-react';

// === UTILITAIRE : DÉTECTER L'APPAREIL ===
const getDeviceType = () => {
  if (typeof navigator === 'undefined') return 'Inconnu';
  const ua = navigator.userAgent;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'Mobile';
  }
  return 'Ordi';
};

// === API HELPER FUNCTIONS ===

// Lire les données
const fetchData = async () => {
  try {
    const response = await fetch('/api/sync');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return {
      days: data.foundDays || [],
      loginCount: data.loginCount || 0,
      totalTime: data.totalTime || 0,
      lastConnection: data.lastConnection || null,
      lastDevice: data.lastDevice || 'Inconnu',
      kissCount: data.kissCount || 0,
      finalMessage: data.finalMessage || ''
    };
  } catch (e) {
    console.error("Erreur lecture KV:", e);
    return { days: [], loginCount: 0, totalTime: 0, lastConnection: null, lastDevice: '', kissCount: 0, finalMessage: '' };
  }
};

// Sauvegarder les jours trouvés
const saveFoundDays = async (days: number[]) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_days', days }),
    });
  } catch (e) {
    console.error("Erreur sauvegarde jours:", e);
  }
};

// Sauvegarder le temps passé
const saveTotalTime = async (time: number) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_time', time }),
    });
  } catch (e) {
    console.error("Erreur sauvegarde temps:", e);
  }
};

// Incrémenter le compteur de connexion + Device Tracker
const incrementLoginCount = async (device: string) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment_login', device }),
    });
  } catch (e) {
    console.error("Erreur incrément login:", e);
  }
};

// Envoyer un Bisou
const sendKiss = async () => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_kiss' }),
    });
  } catch (e) {
    console.error("Erreur envoi bisou:", e);
  }
};

// Sauvegarder le message final (Jour 23)
const saveFinalMessage = async (message: string) => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_message', message }),
    });
  } catch (e) {
    console.error("Erreur sauvegarde message:", e);
  }
};

// Réinitialiser TOUT
const resetAllData = async () => {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
  } catch (e) {
    console.error("Erreur reset:", e);
  }
};

// === TYPEWRITER EFFECT (Machine à écrire) ===
const TypewriterText = ({ text, speed = 30 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let i = 0;
    setDisplayedText(""); 
    const timer = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <p className="text-gray-700 italic leading-relaxed whitespace-pre-line">{displayedText}</p>;
};

// === VOICE PLAYER (LECTEUR VOCAL) ===
const VoicePlayer = ({ day }: { day: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.error("Erreur lecture:", e);
        setError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (error) return null; // Cache le lecteur si pas de fichier

  return (
    <div className="mt-6 mb-6 bg-rose-50 rounded-2xl p-4 flex items-center gap-4 border border-rose-200 shadow-sm relative overflow-hidden">
      <audio
        ref={audioRef}
        src={`/voix_jour${day}.mp3`}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={() => setError(true)}
      />
      <button
        onClick={togglePlay}
        className="relative z-10 w-12 h-12 flex items-center justify-center bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-md hover:scale-105 active:scale-95"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
      </button>
      
      <div className="flex-1 flex flex-col justify-center z-10">
        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Note Vocale</span>
        <div className="flex items-center gap-1 h-6">
          {[...Array(12)].map((_, i) => (
              <div
                  key={i}
                  className={`w-1 bg-rose-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-wave' : 'h-1.5 opacity-50'}`}
                  style={{
                      height: isPlaying ? `${Math.random() * 20 + 8}px` : '4px',
                      animationDelay: `${i * 0.05}s`
                  }}
              />
          ))}
        </div>
      </div>

      {/* Déco de fond */}
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/50 to-transparent pointer-events-none" />
      
      <style jsx>{`
        @keyframes wave {
            0%, 100% { height: 6px; opacity: 0.6; }
            50% { height: 24px; opacity: 1; }
        }
        .animate-wave {
            animation: wave 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

// === 1. TICKET A GRATTER (CANVAS) - Mise à jour pour les 3 types ===
const ScratchCard = ({ onClose, type = 'default' }: { onClose: () => void, type?: 'default' | 'pizza' | 'massage' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);

  const contentData = useMemo(() => {
    switch (type) {
      case 'pizza':
        return { title: "Bon 🍕", secretText: "Valable pour une (1) sortie pizza boisée avec ton chéri. Mmmhhh", code: "PIZZA-BOISEE", color: "from-orange-400 to-red-500", emoji: "🍕" };
      case 'massage':
        return { title: "Bon 💆‍♂️", secretText: "Valable pour une (1) séance de massage relaxant donnée par mes soins. Durée illimitée.", code: "RELAX-MAX", color: "from-teal-400 to-blue-500", emoji: "💆‍♀️" };
      default:
        return { title: "Ticket Magique 🎫", secretText: "Je t'aime + que tout\n(Bon valable pour un gros câlin)", code: "LOVE-U", color: "from-rose-100 to-purple-100", emoji: "🥰" };
    }
  }, [type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.offsetWidth || 300;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Couche grise à gratter
    ctx.fillStyle = '#cbd5e1'; // gris
    ctx.fillRect(0, 0, width, height);
    
    // Texte "Gratte moi"
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ GRATTE ICI ✨', width / 2, height / 2);

    let isDrawing = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      checkScratchPercent();
    };

    const checkScratchPercent = () => {
      // Optimisation: on ne check pas à chaque pixel, c'est lourd, mais ok pour ce petit usage
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) transparentPixels++;
      }
      const percent = (transparentPixels / (pixels.length / 4)) * 100;
      setScratchedPercent(percent);
      if (percent > 50) setIsRevealed(true);
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => { isDrawing = true; const pos = getPos(e); scratch(pos.x, pos.y); };
    const stopDrawing = () => { isDrawing = false; };
    const draw = (e: MouseEvent | TouchEvent) => { 
      if (!isDrawing) return; 
      e.preventDefault(); // Empêche le scroll sur mobile
      const pos = getPos(e); 
      scratch(pos.x, pos.y); 
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        // clean up...
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
        
        <h2 className="text-2xl font-bold text-rose-600 mb-2">{contentData.title}</h2>
        <p className="text-gray-500 mb-4 text-sm">Gratte la zone ci-dessous pour découvrir ton message !</p>
        
        <div className={`relative w-full h-[200px] rounded-xl overflow-hidden bg-gradient-to-br ${type === 'default' ? 'from-rose-100 to-purple-100' : contentData.color} border-2 border-dashed border-rose-300`}>
            {/* CONTENU CACHÉ SOUS LE GRATTAGE */}
            <div className={`absolute inset-0 flex items-center justify-center p-4 flex-col ${type === 'default' ? '' : 'text-white'}`}>
                <span className="text-4xl mb-2">{contentData.emoji}</span>
                <p className={`font-satisfy text-2xl font-bold ${type === 'default' ? 'text-rose-600' : ''} whitespace-pre-line`}>{contentData.secretText}</p>
                {type !== 'default' && (
                  <div className="mt-4 bg-white/20 py-1 px-3 rounded-full text-xs font-mono inline-block">
                    CODE: {contentData.code}
                  </div>
                )}
            </div>
            
            {/* CANVAS DE GRATTAGE */}
            <canvas 
                ref={canvasRef} 
                className={`absolute inset-0 touch-none transition-opacity duration-1000 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            />
        </div>

        {isRevealed && (
            <div className="mt-4 animate-bounce text-green-600 font-bold">
                🎉 Gagné ! 🎉
            </div>
        )}
        {type !== 'default' && isRevealed && (
          <p className="text-center text-gray-500 text-xs mt-2 pb-1">Fais une capture d'écran pour l'utiliser !</p>
        )}
      </div>
    </div>
  );
};

// === 2. BOULE DE CRISTAL (COMPLIMENTS) ===
const CrystalBall = ({ onClose }: { onClose: () => void }) => {
// ... (composant inchangé)
  const [compliment, setCompliment] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const compliments = [
    "Tu es la plus belle chose qui me soit arrivée.",
    "Ton sourire illumine ma journée, vraiment.",
    "T'es intelligente, drôle et magnifique. Le combo parfait.",
    "J'aime quand tu prends soin de moi, je me sens vraiment aimé.",
    "Même en pyjama, t'es la plus belle femme du monde.",
    "T'as un beauté de fou, tu t'en rends même pas compte.",
    "Je suis fier de la femme que tu deviens.",
    "Tes yeux... je pourrais les regarder pendant des heures.",
    "T'es vraiment la femme de ma vie."
  ];

  const shakeBall = () => {
    if (isShaking) return;
    setIsShaking(true);
    setCompliment(null);
    setTimeout(() => {
      const random = compliments[Math.floor(Math.random() * compliments.length)];
      setCompliment(random);
      setIsShaking(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
        <div className="bg-indigo-950 rounded-full p-10 shadow-2xl max-w-sm w-full aspect-square flex flex-col items-center justify-center text-center relative border-4 border-indigo-400 shadow-indigo-500/50" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-6 right-6 text-indigo-300 hover:text-white"><X /></button>
            
            {!compliment ? (
                <>
                    <div className={`text-6xl mb-4 ${isShaking ? 'animate-spin' : ''}`}>🔮</div>
                    <h2 className="text-xl font-bold text-indigo-200 mb-6">La Boule de Cristal</h2>
                    <button 
                        onClick={shakeBall}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-500 transition-all font-bold shadow-lg hover:shadow-indigo-500/50"
                    >
                        {isShaking ? "Consultation..." : "Dis-moi quelque chose"}
                    </button>
                </>
            ) : (
                <div className="animate-in fade-in zoom-in duration-700">
                    <p className="font-satisfy text-2xl text-indigo-100 leading-relaxed drop-shadow-md">
                        "{compliment}"
                    </p>
                    <button 
                        onClick={shakeBall}
                        className="mt-6 text-sm text-indigo-400 hover:text-indigo-200 underline"
                    >
                        Encore un ?
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

// === 4. GELULES DE SECOURS (EMERGENCY KIT) ===
const EmergencyKit = ({ onClose }: { onClose: () => void }) => {
// ... (composant inchangé)
  const [openPill, setOpenPill] = useState<string | null>(null);

  const pills = [
    { id: 'sad', icon: '😢', label: "Je suis triste", color: "bg-blue-500", content: "Mon coeur sache que ca va aller tu peux toujours tout me parler n'oublies jamais vraiment n'hésite jamais Déborah je ferai tout pour toi ❤️" },
    { id: 'angry', icon: '😡', label: "Je suis énervée", color: "bg-red-500", content: "Si t'es enervé contre moi ou bien quelqu'un de ta famille essaye de repenser a nos moments si doux et on essayera d'arranger ca ensemble je te le promet Déborah" },
    { id: 'miss', icon: '🥺', label: "Tu me manques", color: "bg-purple-500", content: "Tu me manques aussi terriblement. Regarde le compte à rebours en bas de la page. Chaque seconde qui passe nous rapproche. Tiens bon, je suis sure que tu m'accuilleras super bien au retour" },
    { id: 'sleep', icon: '😴', label: "J'arrive pas à dormir", color: "bg-indigo-900", content: "Éteins tout. Coupe les réseaux et pense à notre meilleur souvenir. Imagine-nous sur un lit avec moi qui te sert fort. Bonne nuit ma princesse 🌙" },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
        <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
            
            <div className="text-center mb-6">
                <div className="inline-block p-3 bg-red-100 rounded-full mb-2">
                    <Pill className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Trousse de Secours 🚑</h2>
                <p className="text-gray-500 text-sm">À ouvrir en cas d'urgence émotionnelle</p>
            </div>

            {!openPill ? (
                <div className="grid grid-cols-1 gap-3">
                    {pills.map(pill => (
                        <button
                            key={pill.id}
                            onClick={() => setOpenPill(pill.id)}
                            className={`${pill.color} text-white p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-105 shadow-md`}
                        >
                            <span className="text-3xl">{pill.icon}</span>
                            <span className="font-bold text-lg">{pill.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                    <button onClick={() => setOpenPill(null)} className="text-sm text-gray-400 mb-4 flex items-center gap-1">
                        ← Retour
                    </button>
                    {(() => {
                        const pill = pills.find(p => p.id === openPill);
                        return pill ? (
                            <div>
                                <div className="text-4xl mb-4 text-center">{pill.icon}</div>
                                <h3 className="text-xl font-bold text-center mb-4">{pill.label}</h3>
                                <p className="text-gray-700 leading-relaxed text-center italic bg-white p-4 rounded-lg shadow-sm">
                                    "{pill.content}"
                                </p>
                            </div>
                        ) : null;
                    })()}
                </div>
            )}
        </div>
    </div>
  );
};

// === COMPONANT MOTUS (SUTOM) ===
const MotusGame = ({ onClose }: { onClose: () => void }) => {
// ... (composant inchangé)
  const TARGET_WORD = "BELLECOUR";
  const [guess, setGuess] = useState("");
  const [isWon, setIsWon] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.toUpperCase() === TARGET_WORD) {
      setIsWon(true);
    } else {
      setErrorMsg("Ce n'est pas le bon mot... Essaie encore !");
      setGuess("");
      setTimeout(() => setErrorMsg(""), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full text-center relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X /></button>
        
        {!isWon ? (
          <>
            <h2 className="text-3xl font-bold text-rose-600 mb-2">MOTUS DU COUPLE</h2>
            <p className="text-gray-600 mb-6 italic">Un lieu important pour nous... (9 lettres)</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center gap-1 mb-4">
                {TARGET_WORD.split('').map((_, i) => (
                  <div key={i} className="w-8 h-10 border-2 border-gray-300 rounded flex items-center justify-center text-xl font-bold text-gray-700 uppercase bg-gray-50">
                    {guess[i] || ""}
                  </div>
                ))}
              </div>
              
              <input 
                type="text" 
                maxLength={9}
                value={guess}
                onChange={(e) => setGuess(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 text-center text-xl tracking-widest border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:outline-none uppercase"
                placeholder="TAPE ICI"
                autoFocus
              />
              
              {errorMsg && <p className="text-red-500 font-medium animate-bounce">{errorMsg}</p>}
              
              <button type="submit" className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-all">
                VALIDER
              </button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-bold text-green-500 mb-4">GAGNÉ ! 🎉</h2>
            <p className="text-gray-700 mb-4">Tu as trouvé ! Voici ta récompense...</p>
            <div className="rounded-xl overflow-hidden shadow-lg mb-4 border-4 border-rose-200 rotate-2">
                <img src="/photo_secrete.jpg" alt="Photo Secrète" className="w-full h-auto" />
            </div>
            <a 
              href="/photo_secrete.jpg" 
              download="notre-photo-secrete.jpg"
              className="block w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md flex items-center justify-center gap-2"
            >
                📥 Télécharger la photo
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// === COUPON MODAL (BOITE A BONS) ===
// Ce composant est supprimé et sa logique est intégrée dans ScratchCard.

// === SNOWFALL EFFECT ===
const Snowfall = () => {
// ... (composant inchangé)
  const [flakes, setFlakes] = useState<{id: number, left: number, fontSize: number, duration: number, delay: number}[]>([]);

  useEffect(() => {
    const newFlakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      fontSize: Math.random() * 1.0 + 0.8,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * -30,
    }));
    setFlakes(newFlakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden h-full w-full">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-50px] text-white/60"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.fontSize}rem`,
            animation: `fall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        >
          ❄️
        </div>
      ))}
      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// === CUSTOM CURSOR ===
const CustomCursorStyles = () => (
// ... (composant inchangé)
  <style jsx global>{`
    body {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23f43f5e" stroke="white" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') 12 12, auto;
    }
    button, a, .cursor-pointer {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%23ec4899" stroke="white" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') 14 14, pointer !important;
    }
  `}</style>
);

// === COMPTE A REBOURS (PIED DE PAGE) ===
const ReunionCountdown = ({ onClockClick }: { onClockClick: () => void }) => {
// ... (composant inchangé)
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const targetDate = new Date("2026-01-06T00:00:00+01:00"); 
    const timer = setInterval(() => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();
        if (diff <= 0) {
            setTimeLeft("Je suis là ! ❤️");
            clearInterval(timer);
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${days}j ${hours}h ${minutes}m ${seconds}s`);
        }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="w-full mt-12 mb-8 text-center pb-safe">
        <div className="inline-flex items-center justify-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-rose-200">
            <button onClick={onClockClick} className="focus:outline-none transition-transform active:scale-90 hover:scale-110">
               <Clock className="w-5 h-5 text-rose-500 animate-pulse" />
            </button>
            <span className="text-gray-600 font-medium">Je te serre dans mes bras dans :</span>
            <span className="font-mono font-bold text-rose-600 text-lg">{timeLeft}</span>
        </div>
    </div>
  );
};

// === MOBILE META ===
const MobileAppMeta = () => (
// ... (composant inchangé)
  <>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Calendrier" />
    <link rel="apple-touch-icon" href="/app-icon.png" />
  </>
);

// === BULLES ANIMÉES ===
const BubblesBackground = () => (
// ... (composant inchangé)
  <div className="bubbles-background">
    <div className="bubble"></div>
    <div className="bubble"></div>
    <div className="bubble"></div>
    <div className="bubble"></div>
    <div className="bubble"></div>
    <div className="bubble"></div>
    <div className="bubble"></div>
  </div>
);

// === PUZZLE ===
const GRID_SIZE = 3;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

function shuffleGrid() {
  let grid = Array.from(Array(TILE_COUNT).keys());
  let emptyIndex = TILE_COUNT - 1;
  for (let i = 0; i < 100; i++) {
    const neighbors: number[] = [];
    if (emptyIndex % GRID_SIZE > 0) neighbors.push(emptyIndex - 1);
    if (emptyIndex % GRID_SIZE < GRID_SIZE - 1) neighbors.push(emptyIndex + 1);
    if (emptyIndex >= GRID_SIZE) neighbors.push(emptyIndex - GRID_SIZE);
    if (emptyIndex < TILE_COUNT - GRID_SIZE) neighbors.push(emptyIndex + GRID_SIZE);
    const randomIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
    [grid[emptyIndex], grid[randomIndex]] = [grid[randomIndex], grid[emptyIndex]];
    emptyIndex = randomIndex;
  }
  return grid;
}

const SlidingPuzzle = ({ onClose, imageUrl }: { onClose: () => void, imageUrl: string }) => {
// ... (composant inchangé)
  const [grid, setGrid] = useState(shuffleGrid());
  const [isSolved, setIsSolved] = useState(false);
  const emptyIndex = grid.indexOf(TILE_COUNT - 1);
  const [emptyRow, emptyCol] = [Math.floor(emptyIndex / GRID_SIZE), emptyIndex % GRID_SIZE];

  useEffect(() => {
    if (grid.every((tile, index) => tile === index)) setIsSolved(true);
  }, [grid]);

  const handleTileClick = (index: number) => {
    if (isSolved) return;
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    if (Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1) {
      const newGrid = [...grid];
      [newGrid[index], newGrid[emptyIndex]] = [newGrid[emptyIndex], newGrid[index]];
      setGrid(newGrid);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
      <style>{`
        .puzzle-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          grid-template-rows: repeat(3, 1fr); 
          gap: 2px; 
          border: 2px solid #fff; 
          width: 90vw;
          max-width: 360px;
          aspect-ratio: 1169 / 877;
        }
        .puzzle-tile { 
          width: 100%; 
          height: 100%; 
          background-image: url(${imageUrl}); 
          background-size: 300% 300%;
          transition: all 0.3s ease; 
          cursor: pointer; 
        }
        .puzzle-tile-empty { 
          background-image: none; 
          background-color: #333; 
          cursor: default; 
        }
      `}</style>
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-rose-500 mb-4">Easter Egg ! 🧩</h2>
        <div className="puzzle-grid mx-auto my-4">
          {grid.map((tile, index) => {
            const row = Math.floor(tile / GRID_SIZE);
            const col = tile % GRID_SIZE;
            return (
              <div
                key={tile}
                className={`puzzle-tile ${tile === TILE_COUNT - 1 ? 'puzzle-tile-empty' : ''}`}
                onClick={() => handleTileClick(index)}
                style={{ backgroundPosition: `${col * 50}% ${row * 50}%` }}
              />
            );
          })}
        </div>
        {isSolved && <p className="text-2xl font-bold text-green-500 my-4 animate-bounce">Bravo, tu as réussi ! ❤️</p>}
        <button onClick={onClose} className="bg-rose-500 text-white py-2 px-6 rounded-xl font-semibold hover:bg-rose-600 transition-all">
          Fermer
        </button>
      </div>
    </div>
  );
};

// === MODALE TUTO VIDÉO ===
const VideoTutorialModal = ({ onClose }: { onClose: () => void }) => (
// ... (composant inchangé)
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
    <div className="bg-white rounded-3xl p-2 shadow-2xl w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={onClose}
        className="absolute -top-12 right-0 text-white hover:text-rose-300 transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      
      <div className="relative pt-[177%] w-full rounded-2xl overflow-hidden bg-black">
        <iframe 
          className="absolute top-0 left-0 w-full h-full"
          src="https://www.youtube.com/embed/EyGf-YRcxu0?autoplay=1&loop=1&playlist=EyGf-YRcxu0" 
          title="Tuto Installation"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
      <p className="text-center text-sm text-gray-500 mt-2 pb-2">Appuie sur le carré avec la flèche (Partager) puis "Sur l'écran d'accueil"</p>
    </div>
  </div>
);

// === DONNÉES DU CALENDRIER ===
const CALENDAR_DATA = [
// ... (données inchangées)
  {
    date: "2025-12-17", day: 1,
    letter: "Coucou Déborah, j'espère que tu vas bien, voici surement mon plus gros cadeau que j'ai jamais fait : Un calendrier 100% personnalisé. Bon on a le temps tu verras chaque jour :) Respecte bien tout, ouvre les bons trucs et triches pas hein je te vois venir, et oublie pas que je t'aime. IMPORTANT : Tu appuies sur le bouton 'Cadeau récupéré' UNIQUEMENT quand tu as vraiment récupéré le cadeau dans le bac, pas avant !",
    hint: "Récupérer la lettre B", gift: "Switch",
    giftMessage: "Voilà amuse toi bien, je t'ai installé pleins de jeux incroyables et faits pour toi. Hésite pas à l'utiliser le plus possible des vacances, elle est à toi. Hésite pas si t'as des questions et tout, ton copain est là. Mets toi peut être comme objectif de finir un jeu pendant les vacances, tu verras ça va vraiment t'aider dans ton addiction aux réseaux comme insta ou tiktok et tu seras tellement fière de toi.",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-18", day: 2,
    letter: "Le deuxième jour ! J'espère que t'as kiffé le concept en tout cas il te réserve encore de belles surprises hehe. Petit cadeau aujourd'hui pas énorme mais comme ça tu vas te régaler ;) Je pars en Algérie aujourd'hui, en tout cas je t'oublie jamais je serai là tous les jours pour toi avec ça mmh avoue tu kiffes sah j'ai bien galéré c'est des heures de codage et de galère hein oublie pas j'espère en tout cas je vais bien arriver en Algérie voila voila j'irai avec ma mère.",
    hint: "Récupérer la lettre D", gift: "Reese's",
    giftMessage: "Bon appétit mon coeur mange bien comme ça tu prends des forces pour les cours",
    keywords: ["chocolat", "reese", "beurre de cacahuète", "bonbon"], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-19", day: 3,
    letter: "Troisième jourrrr jsuis en Algérie normalement, de ton côté j'espère que ça va bien, courage dernier jour de cours avant les vacances. Petit cadeau aujourd'hui pour passer un bon matin :)",
    hint: "Récupérer la lettre F et G", gift: "Photo #1 + Stickers",
    giftMessage: "BONUS : des petits tatouages de moi bébé hehe avoue t'es choquée tu t'y attendais pas",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_3.jpg", photoComment: "Tu te souviens ce jour là je t'avais prêté mon bonnet, comment il t'allait trop bien c'est trop mmhhh bien sucré la madame.", photoDownload: true, extraPhoto1: null,
  },
  {
    date: "2025-12-20", day: 4,
    letter: "Premier jour des vacances ! J'espère que ça va bien se passer j'espère que t'as pu jouer à la switch et tout je suis trop content si c'est le cas franchement j'espère que tu vas réussir à vaincre tes addictions grâce à ça et voila. Aujourd'hui objet un peu troll franchement mais au moins la prochaine fois on pourra pas se tromper.",
    hint: "Récupérer la lettre A", gift: "Mesureur de bague",
    giftMessage: "C'était un mesureur de taille de doigt pour les bagues :) À ta place j'aurai envoyé à ramzi la taille comme ça la prochaine fois y'a pas de gna gna c'était pas la bonne",
    keywords: ["bague", "mesureur", "taille", "doigt", "doigts"], hasGuess: true, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-21", day: 5,
    letter: "C'est Dimanche ! Tout est fermé en France alors qu'en Algérie c'est le premier jour de la semaine c'est fou la différence. Ca me donne envie d'aller en Algérie avec toi haha. Bon assez parlé je te laisse voir le petit cadeau.",
    hint: "Récupérer la lettre H", gift: "Photo #2",
    giftMessage: "C'est cool les photos c'est mieux que uniquement sur le téléphone, je comprends la fille dans La Boum haha",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo-jour-5.jpg", photoComment: "Notre fameux fond d'écran papapa", photoDownload: true, extraPhoto1: null,
  },
  { 
    date: "2025-12-22", day: 6, 
    letter: "Lundiii ! je sais pas du tout tu fais quoi peut être tu vas bouger de chez toi ou non en attendant j'espère que tu t'amuses bien. Aujourd'hui pas de photo mais de beaux cadeaux (ET oui 2 ajd hehe profite ça arrivera pas encore beaucoup de fois)", 
    hint: "Récupérer la lettre C et E", 
    gift: "Schweppes Citron + Porte-clé", 
    giftMessage: "Bon apppp! et papapa t'as vu le porte clé j'ai le même il le complète le jour où on s'est mis en couple Déborah.", 
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2025-12-23", day: 7, 
    letter: "C'est mardi et ça fait une semaine que tu ouvres tous les jours le calendrier ! J'espère que tu kiffes en tout cas et que tout se passe bien. J'ai plus de environ 50 h de codage, de galères et quasiment 2000 lignes de code. Il y a 3 easter egg sur la page aussi. À toi de les trouver :)", 
    hint: "Récupérer la lettre K", 
    gift: "Photo #3 + Défi Olfactif", 
    giftMessage: "Petite photo avec une surprise pour ton nez ! ", 
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, 
    photoUrl: "/photo_jour_7.jpg", 
    photoComment: "Comment t'es magnifique Déborah. La photo me rappelle la chanson de aupinard si belle dans l'appareil : Regarde, y a que toi dans cette pellicule", 
    photoDownload: true, extraPhoto1: null,
    perfumeAnswer: 1
  },
  { 
    date: "2025-12-24", day: 8, 
    letter: "Demain c'est noël je crois! Tiens petit cadeau pour te faire belle ! Tu vas surement rejoindre ta famille donc profite", 
    hint: "Récupérer la lettre J", 
    gift: "Vernis Rouge", 
    giftMessage: "Tiens j'espère que t'aimeras ! Petite photo bonus en guise d'exemple :)", 
    keywords: ["vernis", "ongles", "rouge", "manucure"], 
    hasGuess: false, videoUrl: null, 
    isSpecial: true, 
    photoUrl: null, 
    photoComment: null, 
    photoDownload: false, 
    extraPhoto1: "/photo_vernis.jpg" 
  },
  { 
    date: "2025-12-25", day: 9, 
    letter: "C'est Noël ! profite bien même si cet été est pas du tout dans mes convictions et que je veux pas la fêter. Profite bien du petit cadeau.", 
    hint: "Récupérer la lettre M", 
    gift: "Chocolat Dubaï", 
    giftMessage: "Papapappa chocolat dubai c'est maman elle m'a dit tiens pour Déborah la meilleure maman du monde bonne app", 
    keywords: ["chocolat", "dubai", "dubaï"], 
    hasGuess: false, 
    videoUrl: null, 
    isSpecial: true, 
    photoUrl: null, 
    photoComment: null, 
    photoDownload: false, 
    extraPhoto1: null 
  },
  { 
    date: "2025-12-26", day: 10, 
    letter: "10 jours déjà de calendrier ! En tout cas au moment ou je fais ce site, notre relation est mis en pause depuis des semaines maintenant. J'espère vraiment que ce sera réglé d'ici là.", 
    hint: "Récupérer la lettre I", 
    gift: "Photo #4 + Petit chocolat Lindt", 
    giftMessage: "Une nouvelle photoo! Et un petit chocolat pour la route hehe", 
    keywords: [], 
    hasGuess: false, 
    videoUrl: null, 
    isSpecial: false, 
    photoUrl: "/photo_jour_10.jpg", 
    photoComment: "Tu te rappelles ? C'était au tram le retour à la part dieu. On était rentré avec ma sœur et ma mère. On avait passé une super journée et t'as appelé ma mère tata hehe", 
    photoDownload: true, 
    extraPhoto1: null 
  },
  { 
    date: "2025-12-27", day: 11, 
    letter: "Quelle belle journée j'espère ! en tout cas aujourd'hui cadeau pas mal j'espère qu'il marchera je l'espère vraiment ça serait incroyable hehe aussi oublie pas je t'aime. Mmmh à ton avis c'est quoi? Azy devine jsuis sure tu trouveras jamais.", 
    hint: "Récupérer la lettre P", 
    gift: "Adjusteurs de bague", 
    giftMessage: "Y'en a un doré et un transparent, tu peux choisir celui qui rend le mieux.", 
    keywords: ["ajusteur", "bague", "taille"], 
    hasGuess: true, 
    videoUrl: "/ajusteur.mp4", 
    isSpecial: false, 
    photoUrl: null, 
    photoComment: null, 
    photoDownload: false, 
    extraPhoto1: null 
  },
  { 
    date: "2025-12-28", day: 12, 
    letter: "Aujourd'hui je voulais parler de à quel point t'as changé ma vie. Ma vie a été totalement bouleversée depuis que je te connais. T'es la meilleure rencontre de ma vie et je t'aimerai à vie.", 
    hint: "Récupérer la lettre L", 
    gift: "Photo #5 + Défi Olfactif", 
    giftMessage: "Petite photoooo ! Et sens la bien ...", 
    keywords: [], 
    hasGuess: false, 
    videoUrl: null, 
    isSpecial: false, 
    photoUrl: "/photo_jour_12.jpg", 
    photoComment: "On était chez toi c'était vraiment trop bien et t'es trop belle", 
    photoDownload: true, 
    extraPhoto1: null,
    perfumeAnswer: 2
  },
  { 
    date: "2025-12-29", day: 13, 
    letter: "Aujourd'hui j'aimerais parler à quel point tu as évolué. Hier j'ai parlé de moi mais on doit parler de toi aussi. Tu t'es tellement épanouie je suis tellement admiratif de toi Déborah.", 
    hint: "Récupérer la lettre Q et R", 
    gift: "Masque visage + Photo #6", 
    giftMessage: "Aujourd'hui cadeaux 2 en 1 !!! Une petite photo et avec un petit masque hehe je l'ai sélectionné spécialement pour toi j'espère que tu vas aimer. J'ai cherché à varier le plus possible et j'espère que ça te fera plaisir.", 
    keywords: [], 
    hasGuess: false, 
    videoUrl: null, 
    isSpecial: false, 
    photoUrl: "/photo_jour_13.jpg", 
    photoComment: "Un dérivé de la photo de notre fond d'écran ! Tu t'en souviens de cette photo?", 
    photoDownload: true, 
    extraPhoto1: null 
  },
  { 
    date: "2025-12-30", day: 14, 
    letter: "Au jour où j'écris cette lettre on s'est pas parlé de la journée on est en embrouille totale j'en peux vraiment plus j'ai finis à 15h j'ai attendu Déborah jusqu'à 17h30 mais malheureusement elle est rentrée avec sa mère je suis rentré en JD du coup mais voila j'ai pas voulu lui dire car elle allait culpabiliser et c'est ce qu'elle me reprochait donc voila message un peu déprimant aujourd'hui mais y'a des jours avec et des jours sans. Toujours un petit cadeau bien sûr", 
    hint: "Récupérer la lettre N", 
    gift: "Gaufrette", 
    giftMessage: "Petite gaufrettes ! elles sont archi bonnes sah régale toi et essaye de tout finir jette pas", 
    keywords: ["gaufrette", "biscuit", "manger"], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2025-12-31", day: 15, 
    letter: "Aujourd'hui quand je t'écris je suis venu te voir le vendredi pr qu'on parle. Je t'ai re enfin reconnu enfin tu n'imagines pas. Voila ca devient mon journal intime ce calendrier jpp en tout cas Déborah j'ai jamais arrete de faire ca la je suis a 2500 lignes de codes jpp et vraiment je t'ai jamais oublié. Ca me saoule juste jeudi dcp t'as mangé a ton lycee samedi t'as un anniv dimanche t'as entrainement on peut jms sortir. Mais voila tu veux que je te dise quoi.En tout cas j'espere que tu passeras un bon jour de l'an avec ta famille ! te fais pas trop belle a chaque fois tu te fais a ton prime quand je suis pas la. Demain lancement d'une nouvelle série de 7 jours sur le calendrier.", 
    hint: "Récupérer la lettre T", 
    gift: "Photo #7 + Loriana", 
    giftMessage: "T'es tombé sur un bloc caché ! 2 cadeaux en 1 ca me rappelle le jour ou j'avais installé pleins de jeu sur la switch et je l'avais ramené chez toi. En tout cas j'espere que t'en profite bien. Bonne app ", 
    keywords: [], 
    hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: "/photo_jour_15.jpg", photoComment: "Regarde c'était au tout début. J'ai montré la photo à ma mamie elle a dit qu'on a tant grandi.", photoDownload: true, extraPhoto1: null 
  },
  { 
    date: "2026-01-01", day: 16, 
    letter: "LETTRE DU JOUR 16 (NOUVEL AN)", 
    hint: "Récupérer la lettre S", 
    gift: "Nuisette", 
    giftMessage: "MESSAGE CADEAU NUISETTE (À remplir)", 
    keywords: ["nuisette", "lingerie", "vêtement", "pyjama"], 
    hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2026-01-02", day: 17, 
    letter: "LETTRE DU JOUR 17", 
    hint: "Récupérer la lettre U", 
    gift: "Photo #8 + Petit chocolat Lindt", 
    giftMessage: "MESSAGE CADEAU JOUR 17 (À remplir)", 
    keywords: [], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_17.jpg", photoComment: "COMMENTAIRE_PHOTO_8_ICI", photoDownload: true, extraPhoto1: null 
  },
  { 
    date: "2026-01-03", day: 18, 
    letter: "LETTRE DU JOUR 18", 
    hint: "Récupérer la lettre O", 
    gift: "Canette IZEM Cerise", 
    giftMessage: "MESSAGE CADEAU IZEM (À remplir)", 
    keywords: ["canette", "boisson", "ism", "izem", "cerise"], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2026-01-04", day: 19, 
    letter: "LETTRE DU JOUR 19", 
    hint: "Récupérer la lettre V", 
    gift: "Photo #9 + Petit chocolat Lindt", 
    giftMessage: "MESSAGE CADEAU JOUR 19 (À remplir)", 
    keywords: [], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_19.jpg", photoComment: "COMMENTAIRE_PHOTO_9_ICI", photoDownload: true, extraPhoto1: null 
  },
  { 
    date: "2026-01-05", day: 20, 
    letter: "LETTRE DU JOUR 20", 
    hint: "Récupérer la lettre W", 
    gift: "Maillot de foot", 
    giftMessage: "MESSAGE CADEAU MAILLOT (À remplir)", 
    keywords: ["maillot", "foot", "vêtement", "t-shirt"], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2026-01-06", day: 21, 
    letter: "LETTRE DU JOUR 21 (TON RETOUR)", 
    hint: "Récupérer la lettre Z", 
    gift: "Visionneuse Photo", 
    giftMessage: "MESSAGE EXPLICATIF VISIONNEUSE (À remplir)", 
    keywords: ["photo", "visionneuse", "viewer", "camera"], 
    hasGuess: true, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2026-01-07", day: 22, 
    letter: "LETTRE DU JOUR 22", 
    hint: "Récupérer la lettre X", 
    gift: "Schweppes Grenade", 
    giftMessage: "MESSAGE CADEAU SCHWEPPES (À remplir)", 
    keywords: ["schweppes", "grenade", "canette", "boisson"], 
    hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null 
  },
  { 
    date: "2026-01-08", day: 23, 
    letter: "LETTRE DU JOUR 23 (FINALE)", 
    hint: "Récupérer la lettre Y", 
    gift: "Photo #10 (Finale)", 
    giftMessage: "MESSAGE CADEAU JOUR 23 (À remplir)", 
    keywords: [], 
    hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: "/photo_jour_23.jpg", photoComment: "COMMENTAIRE_PHOTO_10_ICI", photoDownload: true, extraPhoto1: null,
    perfumeAnswer: 3
  },
];

// === FEUX D'ARTIFICE ===
const Fireworks = () => (
// ... (composant inchangé)
  <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
    <div className="absolute top-1/4 left-1/4 text-5xl animate-ping">🎆</div>
    <div className="absolute top-1/2 left-1/2 text-7xl animate-bounce">🎇</div>
    <div className="absolute bottom-1/4 right-1/4 text-6xl animate-ping">✨</div>
    <div className="absolute top-1/3 right-1/3 text-5xl animate-bounce">🎉</div>
    <div className="absolute bottom-1/2 left-1/3 text-6xl animate-ping">🎊</div>
  </div>
);

// === BOUTON BISOUS VOLANT ===
const FlyingKiss = ({ onClick }: { onClick: () => void }) => {
// ... (composant inchangé)
    const [position, setPosition] = useState({ top: '50%', left: '50%' });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const moveAndShow = () => {
            const top = Math.random() * 80 + 10; // 10% à 90%
            const left = Math.random() * 80 + 10;
            setPosition({ top: `${top}%`, left: `${left}%` });
            setVisible(true);

            // Disparaît après 3 secondes si pas cliqué
            setTimeout(() => setVisible(false), 3000);
        };

        // Apparaît toutes les 10 à 25 secondes
        const interval = setInterval(moveAndShow, Math.random() * 15000 + 10000);
        
        // Première apparition rapide
        const initialTimer = setTimeout(moveAndShow, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
                setVisible(false);
            }}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[60] text-4xl animate-bounce cursor-pointer transition-transform hover:scale-125 drop-shadow-lg"
        >
            😘
        </button>
    );
};

// === LECTEUR AUDIO ===
const LofiPlayer = ({ play, volume, isMuted }: { play: boolean, volume: number, isMuted: boolean }) => {
// ... (composant inchangé)
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (play) {
      el.play().catch(() => {});
      startedRef.current = true;
    } else {
      el.pause();
      startedRef.current = false;
    }
  }, [play]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

  return <audio ref={audioRef} src="/lofi.mp3" loop />;
};

// === INDICE MOT DE PASSE ===
const PasswordHint = ({ onClose }: { onClose: () => void }) => (
// ... (composant inchangé)
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-rose-500 mb-4">Indice...</h2>
      <p className="text-gray-700 italic">"Il est la tout le temps quand on se parle, on entend rarement parler de lui et il dort toujours. Qui suis-je ?"</p>
      <p className="text-gray-500 text-sm mt-4 mb-6">(PS : Pas de majuscule au mot de passe)</p>
      <button onClick={onClose} className="bg-rose-500 text-white py-2 px-6 rounded-xl font-semibold hover:bg-rose-600 transition-all">J'ai compris</button>
    </div>
  </div>
);

// === GALERIE PHOTOS ===
const PhotoGallery = ({ onClose, foundDays }: { onClose: () => void, foundDays: number[] }) => {
// ... (composant inchangé)
  const photos = CALENDAR_DATA.filter(day => day.photoUrl);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-700 hover:text-rose-500 transition-all p-2 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-3xl font-bold text-rose-500 mb-6 text-center">📸 Galerie Photos</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map(day => {
            const isFound = foundDays.includes(day.day);
            return (
              <div key={day.day} className="relative flex items-center justify-center">
                {isFound ? (
                  <div 
                    className="polaroid cursor-default transition-transform duration-300" 
                    style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }} 
                  >
                    <img 
                      src={day.photoUrl!} 
                      alt={`Jour ${day.day}`} 
                    />
                    <div className="text-center text-sm mt-2 font-semibold text-gray-700">
                      Jour {day.day}
                    </div>
                    {day.photoComment && (
                      <p className="text-center text-gray-500 mt-1 text-xs italic px-1">{day.photoComment}</p>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center aspect-[1/1.3] p-4 rounded-xl shadow-lg">
                    <span className="text-6xl text-gray-700">❓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button onClick={onClose} className="mt-6 w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 transition-all">
          Fermer
        </button>
      </div>
    </div>
  );
};

// === ZOOM PHOTO ===
const PhotoZoom = ({ photoUrl, onClose }: { photoUrl: string, onClose: () => void }) => (
// ... (composant inchangé)
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
    <img 
      src={photoUrl} 
      alt="Zoom" 
      className="max-w-full max-h-full rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()} 
    />
    <button 
      onClick={onClose}
      className="absolute top-4 right-4 bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all text-2xl"
    >
      ×
    </button>
  </div>
);

// === ANIMATION DÉBORAH ===
const DeborahAnimation = () => (
// ... (composant inchangé)
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div className="text-9xl animate-bounce">
      💕 Déborah 💕
    </div>
  </div>
);

// === MINI-JEU MEMORY ===
const MemoryGame = ({ onClose }: { onClose: () => void }) => {
// ... (composant inchangé)
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  
  useEffect(() => {
    const emojis = ['💕', '🌹', '💖', '✨', '🎁', '💝', '🌸', '⭐'];
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setCards(shuffled as any);
  }, []);
  
  const handleClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      if ((cards as any)[newFlipped[0]] === (cards as any)[newFlipped[1]]) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };
  
  const isWon = solved.length === cards.length;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-rose-500 mb-4 text-center">🧠 Memory Game</h2>
        <p className="text-center text-gray-600 mb-4">Coups: {moves}</p>
        
        <div className="grid grid-cols-4 gap-3 mb-6">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={`aspect-square rounded-xl text-4xl flex items-center justify-center transition-all duration-300 ${
                flipped.includes(index) || solved.includes(index)
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}
            >
              {(flipped.includes(index) || solved.includes(index)) ? (card as any) : '?'}
            </button>
          ))}
        </div>
        
        {isWon && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-500">🎉 Bravo ! Tu as gagné en {moves} coups !</p>
          </div>
        )}
        
        <button onClick={onClose} className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 transition-all">
          Fermer
        </button>
      </div>
    </div>
  );
};

// === MENU EXTRAS (BONUS) MODIFIÉ ===
const ExtrasMenu = ({ 
    onOpenScratch, 
    onOpenCrystal, 
    onOpenEmergency,
    onOpenGames, // <--- NOUVELLE PROP
    onClose 
}: { 
    onOpenScratch: () => void, 
    onOpenCrystal: () => void, 
    onOpenEmergency: () => void,
    onOpenGames: () => void, // <--- NOUVEAU TYPE
    onClose: () => void 
}) => {
    return (
        <div className="absolute bottom-20 left-4 z-50 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-rose-200 p-4 w-64 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Valise</h3>
                 <button onClick={onClose} className="text-gray-400 hover:text-rose-500"><X className="w-4 h-4"/></button>
             </div>
             <div className="flex flex-col gap-1">
                 <button onClick={onOpenGames} className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl text-left transition-colors border border-transparent hover:border-indigo-100 group">
                     <span className="text-2xl group-hover:scale-110 transition-transform">🎮</span>
                     <div className="leading-tight">
                         <div className="font-bold text-gray-800 text-sm">Mini-Jeux</div>
                         <div className="text-xs text-gray-500">2048, Quiz, etc.</div>
                     </div>
                 </button>
                 <div className="h-px bg-gray-100 my-1"></div>
                 <button onClick={onOpenScratch} className="flex items-center gap-3 p-3 hover:bg-rose-50 rounded-xl text-left transition-colors border border-transparent hover:border-rose-100">
                     <span className="text-2xl">🎫</span>
                     <div className="leading-tight">
                         <div className="font-bold text-gray-800 text-sm">Ticket à Gratter</div>
                         <div className="text-xs text-gray-500">Tente ta chance !</div>
                     </div>
                 </button>
                 <button onClick={onOpenCrystal} className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-xl text-left transition-colors border border-transparent hover:border-purple-100">
                     <span className="text-2xl">🔮</span>
                     <div className="leading-tight">
                         <div className="font-bold text-gray-800 text-sm">Boule de Cristal</div>
                         <div className="text-xs text-gray-500">Un petit compliment ?</div>
                     </div>
                 </button>
                 <button onClick={onOpenEmergency} className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-left transition-colors border border-transparent hover:border-red-100">
                     <span className="text-2xl">💊</span>
                     <div className="leading-tight">
                         <div className="font-bold text-gray-800 text-sm">Gélules de Secours</div>
                         <div className="text-xs text-gray-500">En cas d'urgence ❤️</div>
                     </div>
                 </button>
             </div>
        </div>
    );
};

// === COMPOSANT PRINCIPAL ===
export default function Home() {
  const [showGames, setShowGames] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [code, setCode] = useState('');
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [foundDays, setFoundDays] = useState<number[]>([]);
  const [loginCount, setLoginCount] = useState(0); 
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.03);
  const [starClickCount, setStarClickCount] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [deborahClickCount, setDeborahClickCount] = useState(0);
  const [showDeborahAnimation, setShowDeborahAnimation] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, emoji: string, x: number, y: number}>>([]);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [buttonOpacity, setButtonOpacity] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  // === GESTION DU VOLUME EN JEU ===
  const [isInGame, setIsInGame] = useState(false);
  const effectiveVolume = isInGame ? (volume * 0.1) : volume; // Le son baisse à 10% quand on joue
  
  // === NOUVEAUX ETATS ===
  const [kissCount, setKissCount] = useState(0);
  const [finalMessageInput, setFinalMessageInput] = useState('');
  const [finalMessageStored, setFinalMessageStored] = useState('');
  const [perfumeResult, setPerfumeResult] = useState<string | null>(null);
  
  // === ETATS ESPION ===
  const [totalTime, setTotalTime] = useState(0); 
  const [sessionTime, setSessionTime] = useState(0);
  const [lastConnection, setLastConnection] = useState<string | null>(null);
  const [lastDevice, setLastDevice] = useState<string>('');

  // === ETATS POUR LES EASTER EGGS EXISTANTS ===
  const [clickCountProgression, setClickCountProgression] = useState(0);
  const [clickCountSurprise, setClickCountSurprise] = useState(0);
  const [clickCountClock, setClickCountClock] = useState(0);
  
  const [showMotus, setShowMotus] = useState(false);
  // Suppression des états spécifiques aux coupons, remplacés par showScratchCard:
  // const [showCouponPizza, setShowCouponPizza] = useState(false);
  // const [showCouponMassage, setShowCouponMassage] = useState(false);

  // === ETATS POUR LES NOUVEAUX BONUS (NEW) ===
  const [showExtrasMenu, setShowExtrasMenu] = useState(false);
  // Type modifié pour contenir le type de ticket ou null
  const [showScratchCard, setShowScratchCard] = useState<'default' | 'pizza' | 'massage' | null>(null); 
  const [showCrystalBall, setShowCrystalBall] = useState(false);
  const [showEmergencyKit, setShowEmergencyKit] = useState(false);

  const adminCode = 'ramzi2010';
  const userCode = 'minou';

  // === CHARGEMENT DEPUIS VERCEL KV ===
  useEffect(() => {
    if (!isClient) return;
    const loadInitialData = async () => {
      const data = await fetchData();
      setFoundDays(data.days);
      setLoginCount(data.loginCount);
      setTotalTime(data.totalTime); 
      setLastConnection(data.lastConnection);
      setLastDevice(data.lastDevice);
      setKissCount(data.kissCount);
      setFinalMessageStored(data.finalMessage);
      setIsDataReady(true);
    };
    loadInitialData();
  }, [isClient]);

  // === CHRONOMÈTRE ESPION ===
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      const timer = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          // Sauvegarde toutes les 10 secondes
          if (newTime % 7 === 0) {
              saveTotalTime(totalTime + newTime);
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, isAdmin, totalTime]);

  // === DÉTECTION ÉVÉNEMENTS SPÉCIAUX (DÉCO) ===
  useEffect(() => {
    if (isClient) {
        const today = new Date();
        const month = today.getMonth(); // 11 = Décembre
        const day = today.getDate();

        // Feux d'artifice le 31 déc et 1er janv
        if ((month === 11 && day === 31) || (month === 0 && day === 1)) {
            setShowFireworks(true);
        }
    }
  }, [isClient]);

  const isChristmas = isClient && new Date().getMonth() === 11 && new Date().getDate() === 25;

  // Helpers de formatage
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatLastSeen = (isoDate: string | null, device: string) => {
    if (!isoDate) return "Jamais";
    const date = new Date(isoDate);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    return `${dateStr} à ${timeStr} sur ${device}`;
  };

  // === SAUVEGARDE VERS VERCEL KV (Jours seulement) ===
  useEffect(() => {
    if (!isDataReady || foundDays.length === 0) return; 
    saveFoundDays(foundDays);
  }, [foundDays, isDataReady]);
  
  // === GESTION DE L'OPACITÉ DU BOUTON AU SCROLL ===
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const scrollPosition = window.scrollY;
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const maxScrollDistance = totalScrollHeight > 0 ? totalScrollHeight : 1; 
      let newOpacity = 1 - Math.min(1, scrollPosition / maxScrollDistance);
      setButtonOpacity(newOpacity);
    };
    handleScroll(); 
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll); 
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
    };
  }, []); 

  // === BLOQUAGE ZOOM IOS ===
  useEffect(() => {
    const handleGesture = (e: Event) => e.preventDefault();
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, false);
    return () => {
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedDay, isAuthenticated]);

  // === PARTICULES ===
  const createParticles = (type: 'hearts' | 'stars' | 'petals' = 'hearts') => {
    const emojis = {
      hearts: ['💕', '💖', '💗', '💝', '❤️'],
      stars: ['✨', '⭐', '🌟', '💫', '⚡'],
      petals: ['🌸', '🌺', '🌼', '🌷', '🌹']
    };
    const newParticles = Array.from({length: 20}, (_, i) => ({
      id: Date.now() + i,
      emoji: emojis[type][Math.floor(Math.random() * emojis[type].length)],
      x: Math.random() * 100,
      y: -10
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 3000);
  };

  const handleKissClick = () => {
      sendKiss();
      createParticles('hearts');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleDeborahClick = () => {
    const newCount = deborahClickCount + 1;
    setDeborahClickCount(newCount);
    if (newCount === 2) {
      setShowDeborahAnimation(true);
      createParticles('hearts');
      setTimeout(() => {
        setShowDeborahAnimation(false);
        setDeborahClickCount(0);
      }, 3000);
    }
    if (newCount > 3) setDeborahClickCount(0); 
  };
  
  const handleHeartClick = () => {
    const newCount = starClickCount + 1;
    setStarClickCount(newCount);
    if (newCount === 3) {
      setShowMemoryGame(true);
      setStarClickCount(0);
    }
  };

  // === CLICK HANDLERS POUR EASTER EGGS (MISE A JOUR) ===
  const handleProgressionClick = () => {
    const newCount = clickCountProgression + 1;
    setClickCountProgression(newCount);
    if (newCount === 3) {
      setShowScratchCard('pizza'); // Ouvre le ScratchCard type Pizza
      createParticles('stars');
      setClickCountProgression(0);
    }
  };

  const handleSurpriseClick = () => {
    const newCount = clickCountSurprise + 1;
    setClickCountSurprise(newCount);
    if (newCount === 3) {
      setShowMotus(true);
      setClickCountSurprise(0);
    }
  };

  const handleClockClick = () => {
    const newCount = clickCountClock + 1;
    setClickCountClock(newCount);
    if (newCount === 3) {
      setShowScratchCard('massage'); // Ouvre le ScratchCard type Massage
      createParticles('hearts');
      setClickCountClock(0);
    }
  };

  useEffect(() => { setIsClient(true); }, []);

  // === GESTION COUNTDOWN ===
  useEffect(() => {
    if (!isClient) return;
    const timer = setInterval(() => {
      const now = new Date();
      const nextDay = CALENDAR_DATA.find(day => new Date(day.date + 'T00:00:00+01:00') > now);
      if (nextDay) {
        const nextUnlockDate = new Date(nextDay.date + 'T00:00:00+01:00');
        const diff = nextUnlockDate.getTime() - now.getTime();
        if (diff > 0) {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${d}j ${h}h ${m}m ${s}s`);
        } else setCountdown("Nouvelle case disponible !");
      } else {
        setCountdown("Tous les cadeaux ont été ouverts !");
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isClient]);

  const handleLogin = async () => {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode === userCode || lowerCode === adminCode) {
      setLoginError(null);
      setFailedAttempts(0);
      
      const isAdminUser = lowerCode === adminCode;
      setIsAuthenticated(true); 
      setIsAdmin(isAdminUser); 
      setPlayMusic(true); 
      setIsMuted(false);

      // Incrémenter le compteur SI c'est "minou" qui se connecte
      if (lowerCode === userCode) {
        const device = getDeviceType();
        incrementLoginCount(device);
      }
      
    } else {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      if (newFailedAttempts === 1) {
        setLoginError('Mot de passe incorrect, essaie encore mon coeur ❤️');
      } else if (newFailedAttempts === 2) {
        setLoginError("Wsh t'abuses deux fois tu rates... t'as besoin d'un indice ? 🤨");
      } else {
        setLoginError(`Toujours pas... C'est la ${newFailedAttempts}ème tentative, tu devrais vraiment utiliser l'indice.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setIsAdmin(false); setCode(''); setFoundDays([]); setPlayMusic(false);
    setFailedAttempts(0);
    setLoginError(null);
  };

  const handleResetAdmin = async () => {
    if (isAdmin && confirm("Es-tu sûr de vouloir TOUT réinitialiser (jours + compteur + temps + historique + bisous + message) ?")) {
      await resetAllData();
      setFoundDays([]);
      setLoginCount(0);
      setTotalTime(0);
      setSessionTime(0);
      setLastConnection(null);
      setLastDevice('');
      setKissCount(0);
      setFinalMessageStored('');
    }
  };

  const isDayUnlocked = (date: string) => {
    if (!isClient) return false;
    if (isAdmin) return true;
    const today = new Date();
    const dayDate = new Date(date + 'T00:00:00+01:00');
    return dayDate <= today;
  };

  const handleDayClick = (day: any) => {
    if (isDayUnlocked(day.date)) {
      setSelectedDay(day);
      setGuessInput('');
      setGuessResult(null);
      setPerfumeResult(null); // Reset parfum game
    }
  };

  const triggerSpecialAnimation = (day: any) => {
    if (day.isSpecial) {
      if (day.day === 16) {
        setShowFireworks(true);
        createParticles('stars');
        setTimeout(() => setShowFireworks(false), 5000);
      } else {
        setShowConfetti(true);
        createParticles('hearts');
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  const handleGuess = () => {
    const day = selectedDay;
    const guess = guessInput.toLowerCase().trim();
    const isCorrect = day.keywords.some((keyword: string) =>
      guess.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(guess)
    );
    if (isCorrect) {
      setGuessResult('correct');
      if (!foundDays.includes(day.day)) {
        setFoundDays([...foundDays, day.day]);
        triggerSpecialAnimation(day);
      }
    } else setGuessResult('incorrect');
  };

  const markAsFound = () => {
    const day = selectedDay;
    if (!foundDays.includes(day.day)) {
      setFoundDays([...foundDays, day.day]);
      triggerSpecialAnimation(day);
    }
  };

  const submitFinalMessage = async () => {
      if (!finalMessageInput.trim()) return;
      
      await saveFinalMessage(finalMessageInput);
      setFinalMessageStored(finalMessageInput);
      
      // Une fois le message envoyé, on marque le jour comme trouvé pour débloquer le cadeau
      markAsFound();
  };

  const checkPerfume = (choice: number, correct: number) => {
      if (choice === correct) {
          setPerfumeResult('correct');
          createParticles('petals');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
      } else {
          setPerfumeResult('incorrect');
      }
  };

  const handleStarClick = () => {
    const newCount = starClickCount + 1;
    setStarClickCount(newCount);
    if (newCount === 3) {
      setShowPuzzle(true);
      setStarClickCount(0);
    }
  };
  
  const handleDayPhotoZoom = (e: React.MouseEvent, photoUrl: string | null) => {
    e.stopPropagation();
    if (photoUrl) {
        setZoomedPhoto(photoUrl);
    }
  };

  const progress = (foundDays.length / CALENDAR_DATA.length) * 100;
  const isPlayingMusic = isAuthenticated && playMusic;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-200 via-pink-100 to-purple-200 relative overflow-hidden transition-all duration-1000">
      <MobileAppMeta />
      <CustomCursorStyles /> {/* Injection du CSS curseur */}
      <Snowfall /> {/* Effet Neige */}
      <BubblesBackground />

      {isClient && <LofiPlayer play={isPlayingMusic} volume={effectiveVolume} isMuted={isMuted} />}
      {isClient && isAuthenticated && !isAdmin && <FlyingKiss onClick={handleKissClick} />}

      {/* === BOUTON BONUS FLOTTANT === */}
{isClient && isAuthenticated && !selectedDay && (
  <div className="fixed bottom-4 left-4 z-50">
      <button
          onClick={() => setShowExtrasMenu(!showExtrasMenu)}
          className="bg-white/90 backdrop-blur text-rose-600 w-14 h-14 p-4 rounded-full shadow-lg border-2 border-rose-200 hover:scale-110 transition-transform flex items-center justify-center"
          title="Ouvrir la valise à souvenirs"
      >
          <Briefcase className="w-6 h-6" />
      </button>
      
      {showExtrasMenu && (
          <ExtrasMenu 
              onOpenScratch={() => { setShowExtrasMenu(false); setShowScratchCard('default'); }}
              onOpenCrystal={() => { setShowExtrasMenu(false); setShowCrystalBall(true); }}
              onOpenEmergency={() => { setShowExtrasMenu(false); setShowEmergencyKit(true); }}
              onOpenGames={() => { setShowExtrasMenu(false); setShowGames(true); }} // <--- AJOUTER CECI
              onClose={() => setShowExtrasMenu(false)}
          />
      )}
  </div>
)}

      {particles.map(p => (
        <div 
          key={p.id}
          className="fixed text-4xl pointer-events-none z-50 animate-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: 'fall 3s linear forwards'
          }}
        >
          {p.emoji}
        </div>
      ))}

      {showDeborahAnimation && <DeborahAnimation />}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉 ✨ 💖 ✨ 🎉</div>
        </div>
      )}
      {showFireworks && <Fireworks />}

      {/* MODALES */}
      {showPasswordHint && <PasswordHint onClose={() => setShowPasswordHint(false)} />}
      {showGallery && <PhotoGallery onClose={() => setShowGallery(false)} foundDays={foundDays} />}
      {zoomedPhoto && <PhotoZoom photoUrl={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />}
      {showMemoryGame && <MemoryGame onClose={() => setShowMemoryGame(false)} />}
      {showPuzzle && <SlidingPuzzle onClose={() => setShowPuzzle(false)} imageUrl="/photo-puzzle.jpg" />}
      {showTutorial && <VideoTutorialModal onClose={() => setShowTutorial(false)} />}
      
      {/* NOUVELLES MODALES (EASTER EGGS & BONUS MENU) */}
      {showMotus && <MotusGame onClose={() => setShowMotus(false)} />}
      {showScratchCard && <ScratchCard onClose={() => setShowScratchCard(null)} type={showScratchCard} />}
      {showCrystalBall && <CrystalBall onClose={() => setShowCrystalBall(false)} />}
      {showEmergencyKit && <EmergencyKit onClose={() => setShowEmergencyKit(false)} />}
      {showGames && (
        <GameLauncher 
            onClose={() => setShowGames(false)} 
            onGameStart={() => setIsInGame(true)} // Baisse le son
            onGameEnd={() => setIsInGame(false)}   // Remet le son
        />
      )}

      {/* LOGIN VIEW */}
      {!isAuthenticated && (
        <div className="min-h-screen flex flex-col justify-center py-12 p-4 relative z-10"> 
          <div className="floating-form rounded-3xl shadow-2xl p-8 max-w-md w-full relative mx-auto">
            <div className="text-center mb-8 title-adjust-login overflow-visible relative">
              {isChristmas && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl">🎅</div>}
              <Heart className="w-24 h-24 text-rose-500 mx-auto mb-4 animate-pulse" /> 
              <h1 className="font-satisfy text-7xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm leading-none">
                <span className="text-6xl md:text-7xl block title-fix-span">Calendrier</span>
                <span className="text-6xl md:text-7xl block">de Déborah</span>
              </h1>
              <p className="text-gray-600 italic mt-2">Pour ma chérie ❤️</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 text-center">Entre le mot de passe pour découvrir tes surprises...</p>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setLoginError(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none bg-white/80 text-base ${
                  loginError ? 'border-red-500 focus:border-red-600' : 'border-rose-300 focus:border-rose-400'
                }`}
              />
              {loginError && (
                <p className="text-red-500 text-sm text-center font-semibold animate-celebrate">
                  {loginError}
                </p>
              )}
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-rose-500 hover:to-pink-600 transition-all animate-bubble"
              >
                Déverrouiller ✨
              </button>
            </div>

            <div className="text-center mt-6 space-y-3">
              {failedAttempts > 0 && (
                <button 
                    onClick={() => setShowPasswordHint(true)} 
                    className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm hover:opacity-80 transition-all"
                >
                  Besoin d'un indice pour le mot de passe ?
                </button>
              )}
              
              <button 
                onClick={() => setShowTutorial(true)}
                className="flex items-center justify-center gap-2 w-full text-gray-500 text-xs hover:text-rose-600 transition-all py-2"
              >
                <Play className="w-3 h-3" />
                Mettre le calendrier sur téléphone (Tutoriel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR OR DAY VIEW */}
      {isAuthenticated && !selectedDay && (
        <div className="max-w-6xl mx-auto py-8 px-4 pb-24 relative z-10"> {/* Padding bottom augmenté pour le footer */}
          <div className="sticky top-0 z-50 bg-white/50 backdrop-blur-md rounded-xl p-3 mb-6 shadow-lg flex justify-between items-center w-full h-16">
            {/* HEADER GAUCHE (CLEAN - HAUTEUR UNIFORME) */}
            <div className="flex items-center gap-2 h-10">
              <button
                onClick={() => setShowGallery(true)}
                // Hauteur h-10 et texte visible
                className="h-10 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-3 py-1 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md"
                title="Galerie Photos"
              >
                <span className="text-lg">📸</span> <span>Galerie</span>
              </button>
              
              {/* BOUTON PLAYLIST YOUTUBE - Carré parfait h-10 w-10 */}
              <a
                href="https://youtube.com/playlist?list=PLSuo-sS57x_6EuhkdTkNTmYYb45CvDz0S&si=wGK5xKLRBp9hHtVm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 text-white p-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center shadow-md"
                title="Notre Playlist Youtube 🎶"
              >
                <Youtube className="w-5 h-5" />
              </a>

              {/* BOUTON ADMIN - Carré parfait h-10 w-10 */}
              {isAdmin && (
                <button
                  onClick={handleResetAdmin}
                  className="w-10 h-10 bg-yellow-400 text-black p-2 rounded-xl text-sm font-semibold hover:bg-yellow-500 transition-all flex items-center justify-center shadow-md"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* HEADER DROITE (SON + LOGOUT - HAUTEUR UNIFORME) */}
            <div className="flex gap-2 items-center h-10">
              {/* BOUTON MUTE/UNMUTE - Carré parfait h-10 w-10 */}
              <button
                onClick={() => {
                  setPlayMusic(true);
                  setIsMuted(!isMuted);
                }}
                className="w-10 h-10 text-rose-600 p-2 rounded-xl text-sm font-semibold hover:bg-white transition-all flex items-center justify-center hover:shadow-md"
                title="Couper/Activer la musique"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-20 h-1 accent-rose-400 hidden sm:block" // Cache le slider sur mobile pour gagner de la place
                title="Volume Musique"
              />

              {/* BOUTON LOGOUT - Carré parfait h-10 w-10 */}
              <button
                onClick={handleLogout}
                className="w-10 h-10 text-rose-600 p-2 rounded-xl text-sm font-semibold hover:bg-white transition-all flex items-center justify-center hover:shadow-md"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ZONE ADMIN : STATISTIQUES */}
          {isAdmin && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Bloc Connexions */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border-l-4 border-purple-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-6 h-6 text-purple-600" />
                        <div>
                        <p className="font-bold text-gray-800 text-sm">Connexions</p>
                        <p className="text-xs text-gray-600">Nb fois :</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-lg">
                        {loginCount}
                    </span>
                </div>

                {/* Bloc Bisous */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border-l-4 border-pink-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 text-pink-600" />
                        <div>
                        <p className="font-bold text-gray-800 text-sm">Bisous Reçus</p>
                        <p className="text-xs text-gray-600">Nb fois :</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-lg">
                        {kissCount}
                    </span>
                </div>

                {/* Bloc Temps Passé */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border-l-4 border-rose-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-rose-600" />
                        <div>
                        <p className="font-bold text-gray-800 text-sm">Temps passé</p>
                        <p className="text-xs text-gray-600">Durée :</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-lg whitespace-nowrap">
                        {formatTime(totalTime + sessionTime)}
                    </span>
                </div>

                {/* Bloc Dernière Vue */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border-l-4 border-blue-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {lastDevice === 'Mobile' ? <Smartphone className="w-6 h-6 text-blue-600" /> : <Monitor className="w-6 h-6 text-blue-600" />}
                        <div>
                        <p className="font-bold text-gray-800 text-sm">Dernière vue</p>
                        <p className="text-xs text-gray-600">
                            {formatLastSeen(lastConnection, lastDevice)}
                        </p>
                        </div>
                    </div>
                </div>

                {/* Bloc Message Final */}
                {finalMessageStored && (
                    <div className="col-span-1 md:col-span-4 bg-white/90 backdrop-blur rounded-xl p-4 shadow-md border-2 border-gold-400 relative">
                        <h3 className="text-rose-600 font-bold flex items-center gap-2 mb-2">
                            <MessageCircleHeart className="w-5 h-5" /> Message Final reçu :
                        </h3>
                        <p className="italic text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">"{finalMessageStored}"</p>
                    </div>
                )}
            </div>
          )}
          
          <div className="text-center mb-8 title-adjust-calendar overflow-visible relative"> 
            {isChristmas && <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-7xl drop-shadow-md z-20">🎅</div>}
            <h1 className="font-satisfy text-7xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm leading-tight">
              <span className="text-7xl md:text-8xl block title-fix-span-top mt-2">Calendrier</span>
              <span className="text-7xl md:text-8xl block">de Déborah</span>
            </h1>
            <p className="text-gray-600 text-lg italic mt-2">17 décembre 2025 - 8 janvier 2026</p>
            <p 
              className="text-rose-600 font-semibold text-xl mt-4 cursor-pointer hover:scale-105 transition-transform" 
              onClick={handleDeborahClick} 
              title="Cliquer 2 fois rapidement pour une animation !" 
            >
              Pour ma chérie 
              <span 
                className="cursor-pointer inline-block mx-1 transition-transform hover:scale-125"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleHeartClick(); 
                }}
                title="Cliquer 3 fois pour une surprise (Jeu Mémory)!"
              >
                ❤️
              </span>
            </p>
          </div>

          {countdown && (
            <div className="sticky top-16 z-40 bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-6 text-center shadow-lg border-2 border-rose-300">
              <p 
                className="text-lg font-semibold text-gray-700 select-none cursor-default active:scale-95 transition-transform"
                onClick={handleSurpriseClick}
              >
                Prochaine surprise dans :
              </p>
              <p className="text-2xl font-bold text-rose-500">{countdown}</p>
            </div>
          )}
          
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8 border-2 border-white/50">
            <div className="flex items-center justify-between mb-3">
              <span 
                className="text-sm font-semibold text-gray-700 select-none cursor-default active:scale-95 transition-transform"
                onClick={handleProgressionClick}
              >
                Progression
              </span>
              <span className="text-sm font-semibold text-rose-600 flex items-center gap-1">
                <Sparkles className="w-4 h-4 fill-rose-500 text-rose-500" />
                {foundDays.length} / {CALENDAR_DATA.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="paper-texture rounded-3xl p-6 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {CALENDAR_DATA.map((day) => {
                const unlocked = isDayUnlocked(day.date);
                const found = foundDays.includes(day.day);
                
                return (
                  <button
                    key={day.day}
                    onClick={() => handleDayClick(day)}
                    disabled={!unlocked}
                    className={`
                      card-3d relative aspect-square rounded-2xl p-4 transition-all duration-300 transform hover:shadow-2xl
                      ${unlocked
                        ? found
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 hover:scale-[1.03]' 
                          : 'bg-gradient-to-br from-rose-400 to-pink-500 hover:scale-[1.03] shadow-rose-300/50 hover:shadow-xl'
                        : 'bg-gray-300 cursor-not-allowed shadow-inner'
                      }
                      ${day.isSpecial ? 'ring-4 ring-yellow-300' : ''}
                    `}
                  >
                    <div className="absolute top-2 right-2">
                      {!unlocked && <Lock className="w-5 h-5 text-gray-600" />}
                      {unlocked && !found && <Unlock className="w-5 h-5 text-white" />}
                      {found && <Gift className="w-5 h-5 text-white fill-white" />}
                    </div>
                    
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-4xl font-bold text-white mb-1">{day.day}</span>
                      <span className="text-xs text-white font-medium capitalize">
                        {isClient ? new Date(day.date + 'T00:00:00+01:00').toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        }) : '...'}
                      </span>
                      {day.isSpecial && (
                        <span title="Jour Spécial">
                          <Sparkles className="w-4 h-4 text-yellow-200 mt-1" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600 text-sm pb-8">
            <p>Chaque jour se débloque automatiquement à minuit 🌙</p>
            <p className="mt-1">
              Les étoiles <span onClick={handleStarClick} className="cursor-pointer" title="Cliquer 3 fois pour une surprise (Jeu Puzzle)">⭐</span> marquent les jours spéciaux
            </p>

            {/* COMPTEUR RETROUVAILLES AVEC EASTER EGG MASSAGE */}
            <ReunionCountdown onClockClick={handleClockClick} />

          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {isAuthenticated && selectedDay && (
        <>
          <div 
            className="back-button-fixed-left"
            style={{ opacity: buttonOpacity }}
          >
            <button 
              onClick={() => setSelectedDay(null)} 
              className="text-rose-600 hover:text-rose-700 font-semibold px-3 py-2 transition-all duration-300 text-center" 
            >
              ← Retour au calendrier
            </button>
          </div>

          <div className="max-w-2xl mx-auto relative z-10 p-4 pb-64">
            <div className="paper-texture rounded-3xl shadow-2xl p-8 mt-16">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full mb-4 relative">
                  {isChristmas && <div className="absolute -top-6 -right-2 text-5xl rotate-12">🎅</div>}
                  <span className="text-4xl font-bold text-white">{selectedDay.day}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 capitalize">
                  {isClient && new Date(selectedDay.date + 'T00:00:00+01:00').toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="torn-paper rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-rose-800 mb-2">💌 Lettre</h3>
                  {/* TYPEWRITER EFFECT */}
                  <TypewriterText text={selectedDay.letter} />
                  
                  {/* LECTEUR VOCAL AJOUTÉ ICI */}
                  <div className="border-t border-rose-200 mt-4 pt-4">
                    <VoicePlayer day={selectedDay.day} />
                  </div>
                </div>

                <div className="post-it rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔍 Indice</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedDay.hint}</p>
                </div>

                {selectedDay.hasGuess && !foundDays.includes(selectedDay.day) && (
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 Devine de quoi il s'agit !</h3>
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                      placeholder="Ta réponse..."
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:outline-none mb-3 text-base"
                    />
                    <button onClick={handleGuess} className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-blue-500 hover:to-blue-600 transition-all">
                      Vérifier
                    </button>
                    
                    {guessResult === 'correct' && (
                      <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-xl text-center font-semibold">
                        Bravo mon amour ! ❤️ Tu as trouvé !
                      </div>
                    )}
                    {guessResult === 'incorrect' && (
                      <div className="mt-4 p-4 bg-orange-100 text-orange-800 rounded-xl text-center">
                        Pas encore... Réessaie ou clique sur "Montrer" 😊
                      </div>
                    )}
                  </div>
                )}

                {!foundDays.includes(selectedDay.day) && (
                  <>
                    {selectedDay.day === 23 ? (
                        // === LOGIQUE CAPSULE TEMPORELLE (JOUR 23) ===
                        <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
                            <h3 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
                                <MessageCircleHeart className="w-6 h-6" /> 
                                Capsule Temporelle
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 italic">
                                Pour débloquer l'ultime cadeau, tu dois m'écrire un message sincère sur ton ressenti et notre futur. Ce message sera sauvegardé pour moi. ❤️
                            </p>
                            <textarea 
                                value={finalMessageInput}
                                onChange={(e) => setFinalMessageInput(e.target.value)}
                                placeholder="Écris ton cœur ici..."
                                className="w-full h-40 p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-gray-700 mb-4 resize-none"
                            />
                            <button 
                                onClick={submitFinalMessage}
                                disabled={!finalMessageInput.trim()}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                                Envoyer & Découvrir
                            </button>
                        </div>
                    ) : (
                        // === BOUTON CLASSIQUE ===
                        <button onClick={markAsFound} className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                            <Gift className="w-5 h-5" />
                            {selectedDay.hasGuess ? "Montrer comment / Cadeau récupéré ✓" : "Cadeau récupéré ✓"}
                        </button>
                    )}
                  </>
                )}

                {foundDays.includes(selectedDay.day) && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl text-center shadow-inner">
                      <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-green-800 mb-2">Cadeau trouvé !</h3>
                      <p className="font-satisfy text-4xl font-bold text-gray-800 mb-4">{selectedDay.gift}</p>
                      
                      {selectedDay.giftMessage && (
                        <div className="mt-4 p-4 bg-white rounded-xl text-left shadow-md">
                          {/* TYPEWRITER EFFECT POUR LE MESSAGE CADEAU AUSSI */}
                          <TypewriterText text={selectedDay.giftMessage} speed={20} />

                          {selectedDay.videoUrl && selectedDay.videoUrl.endsWith('.mp4') && (
                            <div className="mt-4">
                              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">📹 Comment l'utiliser</h3>
                              <video className="aspect-video w-full rounded-xl shadow-lg" controls autoPlay>
                                <source src={selectedDay.videoUrl} type="video/mp4" />
                                Ton navigateur ne supporte pas les vidéos.
                              </video>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* GAME OLFACTIF */}
                    {selectedDay.perfumeAnswer && (
                        <div className="mt-6 bg-amber-50 p-6 rounded-2xl border-2 border-amber-200 text-center shadow-md">
                             <h3 className="font-bold text-amber-800 mb-2 text-lg flex items-center justify-center gap-2">👃 Quiz Olfactif !</h3>
                             <p className="text-sm text-amber-700 mb-4">
                                 Cette photo a une odeur particulière... C'est lequel de mes parfums ?
                                 <br/><span className="text-xs italic opacity-70">(J'espère qu'il y a encore l'odeur mdrr)</span>
                             </p>
                             
                             {!perfumeResult ? (
                                 <div className="flex flex-col gap-2 max-w-xs mx-auto">
                                     {[1, 2, 3].map(num => (
                                         <button 
                                             key={num}
                                             onClick={() => checkPerfume(num, selectedDay.perfumeAnswer)}
                                             className="bg-white border border-amber-300 text-amber-800 py-2 rounded-lg hover:bg-amber-100 transition-colors font-semibold"
                                           >
                                             Parfum {num}
                                         </button>
                                     ))}
                                 </div>
                             ) : (
                                 <div className={`p-4 rounded-xl font-bold ${perfumeResult === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {perfumeResult === 'correct' ? "Bravo mon coeur ! Tu me connais bien toi ❤️" : "Oups... Respire encore un coup !"}
                                     {perfumeResult === 'incorrect' && (
                                         <button onClick={() => setPerfumeResult(null)} className="block mx-auto mt-2 text-xs underline">Réessayer</button>
                                     )}
                                 </div>
                             )}
                        </div>
                    )}

                    {selectedDay.extraPhoto1 && (
                      <div className="bg-gray-50 rounded-2xl p-6 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">💅 Inspiration</h3>
                        <img src={selectedDay.extraPhoto1} alt="Inspiration" className="w-full rounded-xl shadow-md" />
                      </div>
                    )}

                    {selectedDay.photoUrl && (
                      <div className="bg-transparent rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">📸 Souvenir...</h3>
                        <div className="relative mx-auto max-w-md">
                          <div 
                            className="polaroid cursor-pointer hover:scale-105 transition-transform"
                            onClick={(e) => handleDayPhotoZoom(e, selectedDay.photoUrl)}
                          >
                            <img src={selectedDay.photoUrl} alt="Souvenir" className="w-full" />
                            {selectedDay.photoComment && (
                              <p className="text-center text-gray-600 mt-3 text-sm italic leading-relaxed">"{selectedDay.photoComment}"</p>
                            )}
                          </div>
                          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-xs pointer-events-none z-10">
                              🔍 Cliquer pour agrandir
                          </div>
                        </div>
                        {selectedDay.photoDownload && (
                          <a 
                            href={selectedDay.photoUrl} 
                            download={`souvenir-${selectedDay.day}.jpg`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-4 block w-full bg-blue-500 text-white py-2 rounded-xl font-semibold hover:bg-blue-600 transition-all text-center shadow-md"
                          >
                            📥 Télécharger la photo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loader qui remplace !isDataReady */}
      {!isDataReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <Heart className="w-24 h-24 text-rose-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-700 font-semibold">Chargement des données...</p>
          </div>
        </div>
      )}
    </div>
  );
}