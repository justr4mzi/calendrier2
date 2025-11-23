import React, { useState } from 'react';
import { Gamepad2, X, Brain, Grid3X3, Building, Circle, Box } from 'lucide-react';
import ArcadeGame from './ArcadeGame';
import CoupleQuiz from './CoupleQuiz';

interface GameLauncherProps {
  onClose: () => void;
  // NOUVEAU : Ces fonctions permettent de contrôler le son
  onGameStart?: () => void;
  onGameEnd?: () => void;
}

// Ta liste de jeux locaux
const GAMES_LIST = [
  { 
    id: 'quiz', 
    name: 'Quiz du Couple', 
    icon: <Brain className="w-6 h-6" />, 
    color: 'bg-rose-500', 
    type: 'custom' 
  },
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
    icon: <Building className="w-6 h-6" />, 
    color: 'bg-green-600', 
    type: 'arcade', 
    url: '/games/perfect-tidy/index.html' 
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
    if (onGameStart) onGameStart(); // On baisse le son
  };

  // Quand on ferme un jeu (retour au menu jeux)
  const handleCloseGame = () => {
    setActiveGame(null);
    if (onGameEnd) onGameEnd(); // On remet le son
  };

  // Quand on ferme tout le menu jeux
  const handleCloseLauncher = () => {
    if (activeGame && onGameEnd) onGameEnd(); // Sécurité si un jeu était ouvert
    onClose();
  };

  if (activeGame) {
    if (activeGame.type === 'custom') {
      return <CoupleQuiz onClose={handleCloseGame} />;
    }
    return <ArcadeGame url={activeGame.url} title={activeGame.name} onClose={handleCloseGame} />;
  }

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
            <p className="text-gray-500 text-sm">Détends-toi un peu mon cœur</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
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