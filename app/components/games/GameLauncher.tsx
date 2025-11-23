import React, { useState } from 'react';
import { Gamepad2, X, Brain, Grid3X3, Building, Target, Candy } from 'lucide-react';
import ArcadeGame from './ArcadeGame';
import CoupleQuiz from './CoupleQuiz';

interface GameLauncherProps {
  onClose: () => void;
}

const GAMES_LIST = [
  { 
    id: 'quiz', 
    name: 'Quiz du Couple', 
    icon: <Brain className="w-6 h-6" />, 
    color: 'bg-rose-500', 
    type: 'custom' 
  },
  // 1. 2048 (Lien officiel GitHub, très rapide)
  { 
    id: '2048', 
    name: '2048', 
    icon: <Grid3X3 className="w-6 h-6" />, 
    color: 'bg-orange-400', 
    type: 'arcade', 
    url: 'https://gabrielecirulli.github.io/2048/' 
  },
  // 2. Crossy Road (Version CodePen optimisée "Road Cross")
  { 
    id: 'crossy', 
    name: 'Crossy Road', 
    icon: <Gamepad2 className="w-6 h-6" />, 
    color: 'bg-blue-500', 
    type: 'arcade', 
    url: 'https://codepen.io/HunorMarton/full/xxOMQKg' 
  },
  // 3. Candy Crush (Clone Match-3 propre)
  { 
    id: 'candy', 
    name: 'Candy Crush', 
    icon: <Candy className="w-6 h-6" />, 
    color: 'bg-pink-500', 
    type: 'arcade', 
    url: 'https://bullfreak.github.io/candy-crush/' 
  },
  // 4. Tower Blocks (Le même, mais on va régler la lenteur à l'étape 2)
  { 
    id: 'tower', 
    name: 'Tower Blocks', 
    icon: <Building className="w-6 h-6" />, 
    color: 'bg-purple-500', 
    type: 'arcade', 
    url: 'https://codepen.io/ste-vg/full/ppLQNW' 
  },
  // 5. Tir à l'arc (Version CodePen animée)
  { 
    id: 'archery', 
    name: 'Tir à l\'arc', 
    icon: <Target className="w-6 h-6" />, 
    color: 'bg-green-500', 
    type: 'arcade', 
    url: 'https://codepen.io/ste-vg/full/GRooLza' 
  },
];

const GameLauncher = ({ onClose }: GameLauncherProps) => {
  const [activeGame, setActiveGame] = useState<any>(null);

  if (activeGame) {
    if (activeGame.type === 'custom') {
      return <CoupleQuiz onClose={() => setActiveGame(null)} />;
    }
    return <ArcadeGame url={activeGame.url} title={activeGame.name} onClose={() => setActiveGame(null)} />;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-rose-600 transition-colors">
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
                    onClick={() => setActiveGame(game)}
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