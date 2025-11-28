import React, { useState } from 'react';
import { Gamepad2, X, Brain, Grid3X3, Heart, Sticker, Box, Circle, Package } from 'lucide-react'; 
// J'ai ajouté les imports de tes nouveaux jeux ci-dessous :
import ArcadeGame from './ArcadeGame';
import CoupleQuiz from './CoupleQuiz';
import LoveClicker from './LoveClicker'; 
import SharedFridge from './SharedFridge';

interface GameLauncherProps {
  onClose: () => void;
  onGameStart?: () => void;
  onGameEnd?: () => void;
}

// Ta liste de jeux mise à jour
const GAMES_LIST = [
  // --- NOS JEUX PERSO (Les nouveaux sont ici) ---
  { 
    id: 'clicker', 
    name: 'Love Clicker', 
    icon: <Heart className="w-6 h-6" />, 
    color: 'bg-rose-600', 
    type: 'custom' 
  },
  { 
    id: 'fridge', 
    name: 'Frigo Love', 
    icon: <Sticker className="w-6 h-6" />, 
    color: 'bg-yellow-400', 
    type: 'custom' 
  },
  { 
    id: 'quiz', 
    name: 'Quiz du Couple', 
    icon: <Brain className="w-6 h-6" />, 
    color: 'bg-purple-500', 
    type: 'custom' 
  },
  // --- JEUX ARCADE CLASSIQUES ---
  { 
    id: '2048', 
    name: '2048', 
    icon: <Grid3X3 className="w-6 h-6" />, 
    color: 'bg-orange-400', 
    type: 'arcade', 
    url: '/games/2048/index.html' 
  },
  { 
    id: 'crossy', 
    name: 'Crossy Road', 
    icon: <Gamepad2 className="w-6 h-6" />, 
    color: 'bg-blue-500', 
    type: 'arcade', 
    url: '/games/crossy/index.html' 
  },
  { 
    id: 'blockblast', 
    name: 'Block Blast', 
    icon: <Box className="w-6 h-6" />, 
    color: 'bg-indigo-500', 
    type: 'arcade', 
    url: '/games/blockblast/index.html' 
  },
  { 
    id: 'perfecttidy',
    name: 'Perfect Tidy',
    icon: <Package className="w-6 h-6" />,
    color: 'bg-green-600',
    type: 'arcade', 
    url: 'https://relaxgame.win/games/perfect-tidy/' 
  },
  { 
    id: 'circle', 
    name: 'Cercle Parfait', 
    icon: <Circle className="w-6 h-6" />, 
    color: 'bg-emerald-500', 
    type: 'arcade', 
    url: '/games/circle/index.html' 
  },
];

const GameLauncher = ({ onClose, onGameStart, onGameEnd }: GameLauncherProps) => {
  const [activeGame, setActiveGame] = useState<any>(null);

  // Quand on lance un jeu
  const handleLaunchGame = (game: any) => {
    setActiveGame(game);
    if (onGameStart) onGameStart(); 
  };

  // Quand on ferme un jeu
  const handleCloseGame = () => {
    setActiveGame(null);
    if (onGameEnd) onGameEnd(); 
  };

  const handleCloseLauncher = () => {
    if (activeGame && onGameEnd) onGameEnd();
    onClose();
  };

  // --- C'EST ICI QUE LA MAGIE OPÈRE ---
  if (activeGame) {
    // Si c'est le Clicker
    if (activeGame.id === 'clicker') {
        return <LoveClicker onClose={handleCloseGame} />;
    }
    // Si c'est le Frigo
    if (activeGame.id === 'fridge') {
        return <SharedFridge onClose={handleCloseGame} />;
    }
    // Si c'est le Quiz
    if (activeGame.id === 'quiz') {
      return <CoupleQuiz onClose={handleCloseGame} />;
    }
    // Si c'est un jeu externe
    return <ArcadeGame url={activeGame.url} title={activeGame.name} onClose={handleCloseGame} />;
  }

  // --- LE MENU PRINCIPAL ---
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={handleCloseLauncher}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleCloseLauncher} className="absolute top-4 right-4 text-gray-400 hover:text-rose-600 transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
            <div className="inline-block p-3 bg-indigo-100 rounded-full mb-2">
                <Gamepad2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Salle d'Arcade 🕹️</h2>
            <p className="text-gray-500 text-sm">Choisis ton activité mon cœur</p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-2">
            {GAMES_LIST.map((game) => (
                <button
                    key={game.id}
                    onClick={() => handleLaunchGame(game)}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-rose-200 transition-all active:scale-95 group"
                >
                    <div className={`${game.color} text-white p-3 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform`}>
                        {game.icon}
                    </div>
                    <span className="font-bold text-gray-700 text-sm">{game.name}</span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GameLauncher;