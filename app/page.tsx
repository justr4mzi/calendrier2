"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Heart, Lock, Unlock, Gift, Sparkles, LogOut, RefreshCcw, Volume2, VolumeX, X, Play } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { setLogLevel } from 'firebase/firestore';

// Configuration Firebase
// VOS CODES FIREBASE RÉELS SONT INSÉRÉS ICI
const firebaseConfig = {
  apiKey: "AIzaSyDLfQ_tW6y...DLIEY092fkk", 
  authDomain: "calendrier-deborah-8f47b.firebaseapp.com",
  projectId: "calendrier-deborah-8f47b",
  storageBucket: "calendrier-deborah-8f47b.appspot.com",
  messagingSenderId: "666646643143",
  appId: "1:666646643143:web:378d444a1417553f0ed3ec",
  measurementId: "G-VF9FZFZFM6"
};
// L'ID de l'application est utilisé pour le Firestore path de sauvegarde
const appId = 'calendrier-deborah-v1'; 
const initialAuthToken = null; 

// Initialisation des services Firebase
let db: any;
let auth: any;

// === PWA / MOBILE CONFIGURATION ===
const MobileAppMeta = () => (
  <>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Calendrier" />
    <link rel="apple-touch-icon" href="/app-icon.png" />
  </>
);

// === COMPOSANT BULLES ANIMÉES ===
const BubblesBackground = () => (
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
  {
    date: "2025-12-17", day: 1,
    letter: "Coucou Déborah, j'espère que tu vas bien, voici surement mon plus gros cadeau que j'ai jamais fait : Un calendrier 100% personnalisé. Bon on a le temps tu verras chaque jour :) Respecte bien tout, ouvre les bons trucs et triches pas hein je te vois venir, et oublie pas que je t'aime. IMPORTANT : Tu appuyes sur le bouton 'Cadeau récupéré' UNIQUEMENT quand tu as vraiment récupéré le cadeau dans le bac, pas avant !",
    hint: "Récupérer la lettre B", gift: "Switch",
    giftMessage: "Voici amuse toi bien, je t'ai installé pleins de jeux incroyables et faits pour toi. Hésite pas à l'utiliser le plus possible des vacances, elle est à toi. Hésite pas si t'as des questions et tout, ton copain est là. Mets toi peut être comme objectif de finir un jeu pendant les vacances, tu verras ça va vraiment t'aider dans ton addiction aux réseaux comme insta ou tiktok et tu seras tellement fière de toi.",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-18", day: 2,
    letter: "Le deuxième jour ! J'espère que t'as kiffer le concept en tt cas il te réserve encore de belle surprise hehe. Petit cadeau aujourd'hui pas énorme mais comme ca tu vas te régaler ;) Je pars en Algérie aujourd'hui, en tout cas je t'oublie jamais je serai la tout les jours pour toi avec ca mmh avoue tu kiff sah j'ai bien galérer c'est des heures de codage et de galère hein oublie pas j'espère en tout cas je vais bien arriver en Algérie voila voila j'irai avec ma mère.",
    hint: "Récupérer la lettre D", gift: "Reese's",
    giftMessage: "Bonne app mon coeur mange bien comme ca tu prends des forces pour les cours",
    keywords: ["chocolat", "reese", "beurre de cacahuète", "bonbon"], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-19", day: 3,
    letter: "Troisième jourrrr jsuis en Algérie normalement, de ton côté j'espère que ça va bien, courage dernier jour de cours avant les vacances. Petit cadeau aujourd'hui pour passer un bon matin :)",
    hint: "Récupérer la lettre F et G", gift: "Photo #1",
    giftMessage: "BONUS : des petits tatouages de moi bébé hehe avoue tes chockbar tu t'y attendais pas",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_3.jpg", photoComment: "Tu te souviens ce jour la je t'avais prêté mon bonnet, comment il t'allait trop bien c'est trop mmhhh bien sucré la madame.", photoDownload: true, extraPhoto1: null,
  },
  {
    date: "2025-12-20", day: 4,
    letter: "Premier jour des vacances ! J'espère que ca va bien se passer j'espère que t'as pu jouer a la switch et tout je suis trop content si ca serait le cas franchement j'espère que tu vas réussir a vaincre tes addictions grâce a ca et voila . Aujourd'hui objet un peu troll franchement mais au moins la prochaine fois on pourra pas se tromper.",
    hint: "Récupérer la lettre A", gift: "Mesureur de bague",
    giftMessage: "C'était un mesureur de taille de doigt pour les bagues :) A ta place j'aurai envoyé a ramzi la taille comme ca la prochaine fois pas ya pas de gna gna c'était pas la bonne",
    keywords: ["bague", "mesureur", "taille", "doigt", "doigts"], hasGuess: true, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null,
  },
  {
    date: "2025-12-21", day: 5,
    letter: "C'est Dimanche ! Tout est fermé en France alors qu'en Algérie c'est le premier jour de la semaine c'est fou la différence. Ca me donne envie d'aller en Algérie avec toi haha. Bon assez parle je te laisse voir le petit cadeau.",
    hint: "Récupérer la lettre H", gift: "Photo #2",
    giftMessage: "C'est cool les photos c'est mieux que uniquement sur le téléphone, je comprends la fille dans La Boume haha",
    keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo-jour-5.jpg", photoComment: "Notre fameux fond d'écran papapa", photoDownload: true, extraPhoto1: null,
  },
  { date: "2025-12-22", day: 6, letter: "LETTRE DU JOUR 6", hint: "Bac B + Bac C", gift: "Schweppes Citron + Porte-clé", giftMessage: "MESSAGE CADEAU JOUR 6", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2025-12-23", day: 7, letter: "LETTRE DU JOUR 7", hint: "Bac A", gift: "Photo #3", giftMessage: "MESSAGE CADEAU JOUR 7", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_7.jpg", photoComment: "COMMENTAIRE_PHOTO_3_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2025-12-24", day: 8, letter: "LETTRE DU JOUR 8", hint: "Bac D", gift: "Vernis Rouge", giftMessage: "MESSAGE CADEAU VERNIS", keywords: ["vernis", "ongles", "rouge", "manucure"], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: "/photo_vernis.jpg" },
  { date: "2025-12-25", day: 9, letter: "LETTRE DU JOUR 9 (NOEL)", hint: "Bac B", gift: "Chocolat Dubaï", giftMessage: "MESSAGE CADEAU CHOCOLAT", keywords: ["chocolat", "dubai", "dubaï"], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2025-12-26", day: 10, letter: "LETTRE DU JOUR 10", hint: "Bac A", gift: "Photo #4", giftMessage: "MESSAGE CADEAU JOUR 10", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_10.jpg", photoComment: "COMMENTAIRE_PHOTO_4_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2025-12-27", day: 11, letter: "LETTRE DU JOUR 11", hint: "Bac C", gift: "Adjusteurs de bague", giftMessage: "MESSAGE CADEAU ADJUSTEURS", keywords: ["adjusteur", "bague", "doré", "argenté"], hasGuess: true, videoUrl: "/ajusteur.mp4", isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2025-12-28", day: 12, letter: "LETTRE DU JOUR 12", hint: "Bac A", gift: "Photo #5", giftMessage: "MESSAGE CADEAU JOUR 12", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_12.jpg", photoComment: "COMMENTAIRE_PHOTO_5_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2025-12-29", day: 13, letter: "LETTRE DU JOUR 13", hint: "Bac C + Bac A", gift: "Masque visage + Photo #6", giftMessage: "MESSAGE CADEAU JOUR 13", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_13.jpg", photoComment: "COMMENTAIRE_PHOTO_6_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2025-12-30", day: 14, letter: "LETTRE DU JOUR 14", hint: "Bac B", gift: "Gaufrette", giftMessage: "MESSAGE CADEAU GAUFRETTE", keywords: ["gaufrette", "reese", "gâteau"], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2025-12-31", day: 15, letter: "LETTRE DU JOUR 15 (NOUVEL AN)", hint: "Bac A", gift: "Photo #7", giftMessage: "MESSAGE CADEAU JOUR 15", keywords: [], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: "/photo_jour_15.jpg", photoComment: "COMMENTAIRE_PHOTO_7_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2026-01-01", day: 16, letter: "LETTRE DU JOUR 16 (NOUVEL AN)", hint: "Bac D", gift: "Nuisette", giftMessage: "MESSAGE CADEAU NUISETTE", keywords: ["nuisette", "lingerie", "tissu", "vêtement"], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2026-01-02", day: 17, letter: "LETTRE DU JOUR 17", hint: "Bac A", gift: "Photo #8", giftMessage: "MESSAGE CADEAU JOUR 17", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_17.jpg", photoComment: "COMMENTAIRE_PHOTO_8_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2026-01-03", day: 18, letter: "LETTRE DU JOUR 18", hint: "Bac B", gift: "Canette IZEM Cerise", giftMessage: "MESSAGE CADEAU IZEM", keywords: ["canette", "boisson", "ism", "izem", "cerise"], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2026-01-04", day: 19, letter: "LETTRE DU JOUR 19", hint: "Bac A", gift: "Photo #9", giftMessage: "MESSAGE CADEAU JOUR 19", keywords: [], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: "/photo_jour_19.jpg", photoComment: "COMMENTAIRE_PHOTO_9_ICI", photoDownload: true, extraPhoto1: null },
  { date: "2025-12-05", day: 20, letter: "LETTRE DU JOUR 20", hint: "Bac D", gift: "Maillot de foot", giftMessage: "MESSAGE CADEAU MAILLOT", keywords: ["maillot", "foot", "vêtement"], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2026-01-06", day: 21, letter: "LETTRE DU JOUR 21 (TON RETOUR)", hint: "Bac C", gift: "Visionneuse Photo", giftMessage: "MESSAGE EXPLICATIF VISIONNEUSE", keywords: ["photo", "visionneuse", "viewer"], hasGuess: true, videoUrl: null, isSpecial: true, photoUrl: "/photo_jour_21.jpg", photoComment: "COMMENTAIRE_PHOTO_10_ICI", photoDownload: false, extraPhoto1: null },
  { date: "2026-01-07", day: 22, letter: "LETTRE DU JOUR 22", hint: "Bac B", gift: "Schweppes Grenade", giftMessage: "MESSAGE CADEAU SCHWEPPES", keywords: ["schweppes", "grenade", "canette"], hasGuess: false, videoUrl: null, isSpecial: false, photoUrl: null, photoComment: null, photoDownload: false, extraPhoto1: null },
  { date: "2026-01-08", day: 23, letter: "LETTRE DU JOUR 23 (FINALE)", hint: "Bac A", gift: "Photo #10 (Finale)", giftMessage: "MESSAGE CADEAU JOUR 23", keywords: [], hasGuess: false, videoUrl: null, isSpecial: true, photoUrl: "/photo_jour_23.jpg", photoComment: "COMMENTAIRE_PHOTO_10_ICI", photoDownload: true, extraPhoto1: null },
];

// === FEUX D'ARTIFICE ===
const Fireworks = () => (
  <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
    <div className="absolute top-1/4 left-1/4 text-5xl animate-ping">🎆</div>
    <div className="absolute top-1/2 left-1/2 text-7xl animate-bounce">🎇</div>
    <div className="absolute bottom-1/4 right-1/4 text-6xl animate-ping">✨</div>
    <div className="absolute top-1/3 right-1/3 text-5xl animate-bounce">🎉</div>
    <div className="absolute bottom-1/2 left-1/3 text-6xl animate-ping">🎊</div>
  </div>
);

// === LECTEUR AUDIO (PERSISTANT, MONTE UNE SEULE FOIS) ===
const LofiPlayer = ({ play, volume, isMuted }: { play: boolean, volume: number, isMuted: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (play) {
      el.play().catch(() => {});
      startedRef.current = true;
    } else {
      // Ne coupe pas si une modale s'ouvre, on coupe seulement si play=false global
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
    <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-xl font-bold text-rose-500 mb-4">Indice...</h2>
      <p className="text-gray-700 italic">"Il est la tout le temps quand on se parle, on entend rarement parler de lui et il dort toujours. Qui suis-je ?"</p>
      <p className="text-gray-500 text-sm mt-4 mb-6">(PS : Pas de majuscule au mot de passe)</p>
      <button onClick={onClose} className="bg-rose-500 text-white py-2 px-6 rounded-xl font-semibold hover:bg-rose-600 transition-all">J'ai compris</button>
    </div>
    
  </div>
);

// === GALERIE PHOTOS (MODIFIÉ) ===
const PhotoGallery = ({ onClose, foundDays }: { onClose: () => void, foundDays: number[] }) => {
  const photos = CALENDAR_DATA.filter(day => day.photoUrl);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        
        {/* BOUTON FERMER (CROIX) */}
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
                    style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }} // Léger tilt aléatoire
                  >
                    <img 
                      src={day.photoUrl!} 
                      alt={`Jour ${day.day}`} 
                    />
                    <div className="text-center text-sm mt-2 font-semibold text-gray-700">
                      Jour {day.day}
                    </div>
                    {/* AFFICHAGE COMPLET DU COMMENTAIRE */}
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
    <img 
      src={photoUrl} 
      alt="Zoom" 
      className="max-w-full max-h-full rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique sur l'image elle-même
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
  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div className="text-9xl animate-bounce">
      💕 Déborah 💕
    </div>
  </div>
);

// === MINI-JEU MEMORY ===
const MemoryGame = ({ onClose }: { onClose: () => void }) => {
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

// === COMPOSANT PRINCIPAL ===
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [code, setCode] = useState('');
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [foundDays, setFoundDays] = useState<number[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [guessResult, setGuessResult] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.03); // Volume de base très faible
  const [starClickCount, setStarClickCount] = useState(0); // Compteur pour le PUZZLE (étoile)
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [deborahClickCount, setDeborahClickCount] = useState(0); // Compteur pour l'ANIMATION DÉBORAH
  const [showDeborahAnimation, setShowDeborahAnimation] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, emoji: string, x: number, y: number}>>([]);
  const [showMemoryGame, setShowMemoryGame] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false); // Nouvel état pour gérer le timeout
  const [buttonOpacity, setButtonOpacity] = useState(1); // Opacité du bouton Retour
  const [showTutorial, setShowTutorial] = useState(false); // État pour la modale tuto
  
  // Nouveaux états pour la gestion des erreurs de connexion
  const [loginError, setLoginError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const adminCode = 'ramzi2010';
  const userCode = 'minou';
  const userSaveKey = 'found_days';

  // === NOUVEAU : BLOQUAGE DU ZOOM IOS (Pincement & Double-tap) ===
  useEffect(() => {
    // 1. Bloquer le zoom par pincement (Gesture)
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    // 2. Bloquer le zoom par double-tap
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // 3. Ajout des écouteurs d'événements
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, false);

    // Nettoyage
    return () => {
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // === SCROLL AUTOMATIQUE EN HAUT ===
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedDay, isAuthenticated]);

  // === PARTICULES PERSONNALISÉES ===
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

  // === ANIMATION DÉBORAH (2 CLICS SUR LE NOM) ===
  const handleDeborahClick = () => {
    const newCount = deborahClickCount + 1;
    setDeborahClickCount(newCount);
    
    if (newCount === 2) {
      setShowDeborahAnimation(true);
      createParticles('hearts');
      setTimeout(() => {
        setShowDeborahAnimation(false);
        setDeborahClickCount(0); // Réinitialise le compteur après l'animation
      }, 3000);
    }
    // Si l'utilisateur clique plus de 3 fois rapidement, on réinitialise pour ne pas bloquer le compteur.
    if (newCount > 3) setDeborahClickCount(0); 
  };
  
  // === MINI-JEU Mémory (3 CLICS SUR LE COEUR) ===
  const handleHeartClick = () => {
    const newCount = starClickCount + 1;
    setStarClickCount(newCount);
    
    if (newCount === 3) {
      setShowMemoryGame(true);
      setStarClickCount(0); // Réinitialise le compteur après le déclenchement
    }
  };

  useEffect(() => { setIsClient(true); }, []);

  // === GESTION DU TIMEOUT DE CHARGEMENT ===
  useEffect(() => {
    if (!isDataReady) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true); // Passe à true après 3 secondes
      }, 3000); 
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false); // Annule si les données sont prêtes
    }
  }, [isDataReady]);

  // === FIREBASE SETUP ET LECTURE DES DONNÉES ===
  useEffect(() => {
    if (!isClient || !firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        setIsDataReady(true); 
        return;
    }

    try {
      // Configuration et initialisation
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      setLogLevel('debug');
      
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        }
        
        const currentUserId = auth.currentUser?.uid || crypto.randomUUID();
        setUserId(currentUserId);

        // Démarre l'écoute des données Firestore
        const docRef = doc(db, `artifacts/${appId}/users/${currentUserId}/found_days`, userSaveKey);

        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const foundDaysFromFirestore = (data?.days || []) as number[];
            setFoundDays(foundDaysFromFirestore);
          } else {
            setFoundDays([]);
          }
          setIsDataReady(true); 
        }, () => {
          setIsDataReady(true); 
        });

        return () => {
          unsubscribeSnapshot();
        };
      });

      return () => unsubscribeAuth();

    } catch {
      setIsDataReady(true); 
    }
  }, [isClient]);

  // === SAUVEGARDE DES DONNÉES VERS FIRESTORE ===
  useEffect(() => {
    if (!isDataReady || !userId || !db) return;

    const saveToFirestore = async () => {
      try {
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/found_days`, userSaveKey);
        await setDoc(docRef, { days: foundDays, lastUpdate: new Date().toISOString() });
      } catch {}
    };

    saveToFirestore();
  }, [foundDays, isDataReady, userId]);

  // === GESTION DE L'OPACITÉ DU BOUTON AU SCROLL ===
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 100; 
      let newOpacity = 1 - Math.min(1, scrollPosition / maxScroll);
      setButtonOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // appliqué globalement

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
      // Connexion réussie
      setLoginError(null);
      setFailedAttempts(0); // Réinitialiser le compteur d'échecs
      
      const isAdminUser = lowerCode === adminCode;
      setIsAuthenticated(true); 
      setIsAdmin(isAdminUser); 
      setPlayMusic(true); 
      setIsMuted(false);
      
      if (typeof window !== "undefined") {
         localStorage.setItem('ramzi-auth', 'true');
         localStorage.setItem('ramzi-is-admin', isAdminUser ? 'true' : 'false');
      }

    } else {
      // Connexion échouée
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      if (newFailedAttempts === 1) {
        setLoginError('Mot de passe incorrect, essaie encore mon amour ❤️');
      } else if (newFailedAttempts === 2) {
        setLoginError("Wsh t'abuses deux fois tu rates... besoin d'un indice ? 🤨");
      } else {
        setLoginError(`Toujours pas... C'est la ${newFailedAttempts}ème tentative, tu devrais vraiment utiliser l'indice.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setIsAdmin(false); setCode(''); setFoundDays([]); setPlayMusic(false);
    setFailedAttempts(0); // Réinitialiser l'état d'échec
    setLoginError(null);
    if (auth) {
      auth.signOut();
    }
  };

  const handleResetAdmin = () => {
    if (isAdmin && confirm("Es-tu sûr de vouloir réinitialiser la progression ? Cette action réinitialise la base de données.")) {
      setFoundDays([]);
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

  const handleStarClick = () => {
    const newCount = starClickCount + 1;
    setStarClickCount(newCount);
    if (newCount === 3) {
      setShowPuzzle(true);
      setStarClickCount(0);
    }
  };
  
  // Fonction pour gérer le zoom sur la page du jour
  const handleDayPhotoZoom = (e: React.MouseEvent, photoUrl: string | null) => {
    e.stopPropagation();
    if (photoUrl) {
        setZoomedPhoto(photoUrl);
    }
  };

  const progress = (foundDays.length / CALENDAR_DATA.length) * 100;

  // La musique joue si isAuthenticated est true et playMusic est true.
  const isPlayingMusic = isAuthenticated && playMusic;

  // === RENDU UNIQUE: on garde LofiPlayer monté une seule fois, et on affiche les vues/modales par-dessus ===
  // Note: J'ai retiré le commentaire multi-ligne qui était mal interprété par le compilateur
  // juste avant le return.
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-200 via-pink-100 to-purple-200 relative overflow-hidden transition-all duration-1000">
      <MobileAppMeta /> {/* INCLUSION DU COMPOSANT META DANS LA RACINE */}
      <BubblesBackground />

      {/* Lecteur audio persistant: toujours monté, avec logique de lecture via isPlayingMusic */}
      {isClient && <LofiPlayer play={isPlayingMusic} volume={volume} isMuted={isMuted} />}

      {/* Particules animées (tombent) */}
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

      {/* Modales/overlays montées AU-DESSUS sans changer la musique */}
      {showPasswordHint && <PasswordHint onClose={() => setShowPasswordHint(false)} />}
      {showGallery && <PhotoGallery onClose={() => setShowGallery(false)} foundDays={foundDays} />}
      {zoomedPhoto && <PhotoZoom photoUrl={zoomedPhoto} onClose={() => setZoomedPhoto(null)} />}
      {showMemoryGame && <MemoryGame onClose={() => setShowMemoryGame(false)} />}
      {showPuzzle && <SlidingPuzzle onClose={() => setShowPuzzle(false)} imageUrl="/photo-puzzle.jpg" />}
      {showTutorial && <VideoTutorialModal onClose={() => setShowTutorial(false)} />}

      {/* LOGIN VIEW */}
      {!isAuthenticated && (
        // min-h-screen pour centrer la carte verticalement
        <div className="min-h-screen flex flex-col justify-center py-12 p-4 relative z-10"> 
          <div className="floating-form rounded-3xl shadow-2xl p-8 max-w-md w-full relative mx-auto">
            <div className="text-center mb-8 title-adjust-login overflow-visible">
              {/* Correction: Ajout de mb-4 pour séparer le cœur du titre */}
              <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" /> 
              <h1 className="font-satisfy text-7xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm leading-none">
                <span className="text-6xl block title-fix-span">Calendrier</span>
                <span className="text-6xl block">de l'Après</span>
              </span>
              {/* Correction: Ajout de mt-2 pour séparer le titre de la phrase */}
              <p className="text-gray-600 italic mt-2">Pour ma Déborah ❤️</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700 text-center">Entre le mot de passe pour découvrir tes surprises...</p>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setLoginError(null); // Effacer l'erreur quand l'utilisateur tape
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
                // AJOUT DE text-base (16px) POUR EVITER LE ZOOM IOS
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
              <button 
                  onClick={() => setShowPasswordHint(true)} 
                  className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm hover:opacity-80 transition-all"
              >
                Besoin d'un indice pour le mot de passe ?
              </button>
              {/* NOUVEAU BOUTON TUTO */}
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

      {/* CALENDAR OR DAY VIEW (après connexion) */}
      {isAuthenticated && !selectedDay && (
        <div className="max-w-6xl mx-auto py-8 px-4 relative z-10">
          {/* BARRE DE NAVIGATION FIXE */}
          <div className="sticky top-0 z-50 bg-white/50 backdrop-blur-md rounded-xl p-3 mb-6 shadow-lg flex justify-between items-center w-full">
            <div className="w-1/3 flex justify-start gap-2"> {/* AJOUT: gap-2 ici */}
              {/* GALERIE DÉPLACÉE À GAUCHE */}
              <button
                onClick={() => setShowGallery(true)}
                className="bg-gradient-to-r from-rose-400 to-pink-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md"
                title="Galerie Photos"
              >
                <span className="text-lg">📸</span> Galerie
              </button>
              {isAdmin && (
                <button
                  onClick={handleResetAdmin}
                  className="bg-yellow-400 text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-all flex items-center gap-1.5 justify-center"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Réinitialiser (Admin)
                </button>
              )}
            </div>

            <div className="flex gap-2 items-center">
              {/* Mute / Volume */}
              <button
                onClick={() => {
                  setPlayMusic(true);
                  setIsMuted(!isMuted);
                }}
                className="text-rose-600 p-2 rounded-lg text-sm font-semibold hover:bg-white transition-all flex items-center justify-center hover:shadow-md"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                className="w-20 h-1 accent-rose-400"
                title="Volume Musique"
              />

              <button
                onClick={handleLogout}
                className="text-rose-600 p-2 rounded-lg text-sm font-semibold hover:bg-white transition-all flex items-center justify-center hover:shadow-md"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-center mb-8 title-adjust-calendar overflow-visible"> 
            <h1 className="font-satisfy text-7xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent drop-shadow-sm leading-tight">
              <span className="text-6xl block title-fix-span-top mt-2">Calendrier</span>
              <span className="text-6xl block">de l'Après</span>
            </span>
            <p className="text-gray-600 text-lg italic mt-2">17 décembre 2025 - 8 janvier 2026</p>
            <p 
              className="text-rose-600 font-semibold text-xl mt-4 cursor-pointer hover:scale-105 transition-transform" 
              // Modification: onClick pour l'animation Déborah (2 clics)
              onClick={handleDeborahClick} 
              title="Cliquer 2 fois rapidement pour une animation !" 
            >
              Pour ma Déborah 
              {/* Cœur: gère le Memory Game (3 clics) */}
              <span 
                className="cursor-pointer inline-block mx-1 transition-transform hover:scale-125"
                onClick={(e) => { 
                  e.stopPropagation(); // Stop propagation pour isoler le clic du cœur du parent
                  handleHeartClick(); 
                }}
                title="Cliquer 3 fois pour une surprise (Jeu Mémory)!"
              >
                ❤️
              </span>
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8 border-2 border-white/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Progression</span>
              <span className="text-sm font-semibold text-rose-600 flex items-center gap-1">
                <Sparkles className="w-4 h-4 fill-rose-500 text-rose-500" /> {/* CORRECTION: Retrait du title */}
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

          {countdown && (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-8 text-center shadow-lg border-2 border-rose-300">
              <p className="text-lg font-semibold text-gray-700">Prochaine surprise dans :</p>
              <p className="text-2xl font-bold text-rose-500">{countdown}</p>
            </div>
          )}

          {/* CONTENEUR DE LA GRILLE AVEC TEXTURE DE PAPIER */}
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
                      <span className="text-3xl font-bold text-white mb-1">{day.day}</span>
                      <span className="text-xs text-white font-medium capitalize">
                        {isClient ? new Date(day.date + 'T00:00:00+01:00').toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        }) : '...'}
                      </span>
                      {day.isSpecial && <Sparkles className="w-4 h-4 text-yellow-200 mt-1" />} {/* CORRECTION: Retrait du title */}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>Chaque jour se débloque automatiquement à minuit 🌙</p>
            <p className="mt-1">
              Les étoiles <span onClick={handleStarClick} className="cursor-pointer" title="Cliquer 3 fois pour une surprise (Jeu Puzzle)">⭐</span> marquent les jours spéciaux
            </p>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {isAuthenticated && selectedDay && (
        <>
          {/* Bouton retour fixe à gauche avec transparence au scroll */}
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

          {/* AJOUT D'UN GROS PADDING-BOTTOM (pb-64) POUR LE SCROLL MOBILE */}
          <div className="max-w-2xl mx-auto relative z-10 p-4 pb-64">
            <div className="paper-texture rounded-3xl shadow-2xl p-8 mt-16">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full mb-4">
                  <span className="text-2xl font-bold text-white">{selectedDay.day}</span>
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
                  <p className="text-gray-700 italic leading-relaxed">{selectedDay.letter}</p>
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
                      // AJOUT DE text-base (16px) POUR EVITER LE ZOOM IOS
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
                  <button onClick={markAsFound} className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                    <Gift className="w-5 h-5" />
                    {selectedDay.hasGuess ? "Montrer comment / Cadeau récupéré ✓" : "Cadeau récupéré ✓"}
                  </button>
                )}

                {foundDays.includes(selectedDay.day) && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl text-center shadow-inner">
                      <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-green-800 mb-2">Cadeau trouvé !</h3>
                      <p className="font-satisfy text-4xl font-bold text-gray-800 mb-4">{selectedDay.gift}</p>
                      
                      {selectedDay.giftMessage && (
                        <div className="mt-4 p-4 bg-white rounded-xl text-left shadow-md">
                          <p className="text-gray-700 leading-relaxed">{selectedDay.giftMessage}</p>

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

                    {selectedDay.extraPhoto1 && (
                      <div className="bg-gray-50 rounded-2xl p-6 shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">💅 Inspiration</h3>
                        <img src={selectedDay.extraPhoto1} alt="Inspiration" className="w-full rounded-xl shadow-md" />
                      </div>
                    )}

                    {selectedDay.photoUrl && (
                      <div className="bg-transparent rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">📸 Souvenir...</h3>
                        {/* POLAROID AVEC SCOTCH - CLICABLE POUR LE ZOOM DU JOUR */}
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
                          {/* INDICATEUR ZOOM */}
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

      {/* Loader quand Firestore n'est pas prêt */}
      {!isDataReady && !loadingTimeout && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-700 font-semibold mt-4">Chargement des données...</p>
        </div>
      )}
    </div>
  );
}