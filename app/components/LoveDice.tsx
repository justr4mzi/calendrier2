import React, { useState } from 'react';
import { X, Dices, Heart, Flame, Sparkles } from 'lucide-react';

// === CONFIGURATION DES MODES ===
const MODES = {
  soft: {
    name: "Romantique 🌸",
    color: "bg-rose-500",
    lightColor: "bg-rose-100",
    textColor: "text-rose-600",
    borderColor: "border-rose-200",
    actions: [
      "Petit bisous sur",
      "Long câlin sur",
      "Massage de 2 min sur",
      "Papoille douce sur",
      "Tracer un cœur du bout du doigt sur",
      "Chatouilles sur"
    ],
    zones: [
      "la Joue",
      "le Front",
      "la Main",
      "l'Épaule",
      "le Dos",
      "le Cou"
    ]
  },
  hot: {
    name: "Pimenté 🔥",
    color: "bg-red-600",
    lightColor: "bg-red-100",
    textColor: "text-red-600",
    borderColor: "border-red-200",
    actions: [
      "Mordre doucement",
      "Mordiller intensément",
      "Chuchoter quelque chose de provocateur près de",
      "Donner une fessée sur",
      "Retirer un vêtement"
      "Lécher",
      "Ferler les yeux et lécher"
      "Glisser les doigts lentement le long de",
      "Embrasser avec la langue",
      "Effleurer avec les ongles",
      "Embrasser partout sauf",
      "Sucer"
    ],
    zones: [
      "le Cou",
      "la Nuque"
      "le Creux du dos",
      "la Hanche",
      "les Lèvres",
      "l'Intérieur de la cuisse",
      "le Ventre",
      "la Taille",
      "les Seins/Pecs",
      "les Fesses",
      "le Pubis",
      "les Tétons",
      "Partout où tu veux"
    ]
  }
};

const LoveDice = ({ onClose }: { onClose: () => void }) => {
  const [mode, setMode] = useState<'soft' | 'hot'>('soft');
  
  // État des dés
  const [action, setAction] = useState("?");
  const [zone, setZone] = useState("?");
  
  const [isRolling, setIsRolling] = useState(false);
  const [animateDice, setAnimateDice] = useState(false);

  // Fonction pour lancer les dés
  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    setAnimateDice(true);

    const currentMode = MODES[mode];
    let count = 0;
    
    // Effet de roulement (changement rapide du texte)
    const interval = setInterval(() => {
      // On change les textes aléatoirement
      setAction(currentMode.actions[Math.floor(Math.random() * currentMode.actions.length)]);
      setZone(currentMode.zones[Math.floor(Math.random() * currentMode.zones.length)]);
      
      count++;
      // On arrête après 15 changements (environ 1.5 secondes) pour l'effet de suspens
      if (count > 15) {
        clearInterval(interval);
        setIsRolling(false);
        setAnimateDice(false);
      }
    }, 100);
  };

  // Style dynamique selon le mode (Rose pour Soft, Rouge pour Hot)
  const theme = MODES[mode];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center relative overflow-hidden border-4 transition-colors duration-500"
        style={{ borderColor: mode === 'soft' ? '#fecdd3' : '#fca5a5' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        {/* Titre */}
        <div className="mb-6">
            <div className={`inline-flex p-3 rounded-full mb-3 ${theme.lightColor} ${theme.textColor}`}>
                <Dices className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Les Dés de l'Amour</h2>
            <p className="text-gray-500 text-sm">Laisse le hasard décider...</p>
        </div>

        {/* Sélecteur de Mode (Boutons Soft / Hot) */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8 relative">
            {/* Petit fond blanc animé qui glisse derrière le bouton actif */}
            <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-all duration-300 ease-out ${mode === 'soft' ? 'left-1 bg-white' : 'left-[calc(50%+2px)] bg-white'}`}
            />
            
            <button 
                onClick={() => setMode('soft')}
                className={`flex-1 relative z-10 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'soft' ? 'text-rose-500' : 'text-gray-500'}`}
            >
                <Heart className={`w-4 h-4 ${mode === 'soft' ? 'fill-rose-500' : ''}`} /> Soft
            </button>
            <button 
                onClick={() => setMode('hot')}
                className={`flex-1 relative z-10 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'hot' ? 'text-red-600' : 'text-gray-500'}`}
            >
                <Flame className={`w-4 h-4 ${mode === 'hot' ? 'fill-red-600' : ''}`} /> Hot
            </button>
        </div>

        {/* Zone d'affichage des Dés */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Dé 1 : Action */}
            <div className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all duration-300 ${theme.lightColor} ${theme.borderColor} ${theme.textColor} ${animateDice ? 'animate-bounce' : ''}`}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Action</span>
                <span className="font-bold text-lg leading-tight break-words">
                    {action}
                </span>
            </div>

            {/* Dé 2 : Zone */}
            <div className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border-2 transition-all duration-300 ${theme.lightColor} ${theme.borderColor} ${theme.textColor} ${animateDice ? 'animate-bounce delay-75' : ''}`}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Zone</span>
                <span className="font-bold text-lg leading-tight break-words">
                    {zone}
                </span>
            </div>
        </div>

        {/* Bouton Lancer */}
        <button 
            onClick={rollDice}
            disabled={isRolling}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2 ${theme.color} hover:opacity-90`}
        >
            {isRolling ? (
                <span className="animate-spin">🎲</span>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" /> Lancer les dés
                </>
            )}
        </button>

        {/* Petit message d'avertissement en mode Hot */}
        {mode === 'hot' && (
            <p className="text-xs text-gray-400 mt-4 italic animate-pulse">
                Ça va chauffer... 🔥
            </p>
        )}
      </div>
    </div>
  );
};

export default LoveDice;