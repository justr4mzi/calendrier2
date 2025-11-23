import React, { useState } from 'react';
import { Gamepad2, X, Brain, Grid3X3, Building, Target, Candy } from 'lucide-react';
import ArcadeGame from './ArcadeGame';
import CoupleQuiz from './CoupleQuiz';

interface GameLauncherProps {
  onClose: () => void;
}

const GAMES_LIST = [
  const GAMES_LIST = [
  // On garde ton Quiz personnalisé (c'est mieux pour le couple !)
  { 
    id: 'quiz', 
    name: 'Quiz du Couple', 
    icon: <Brain className="w-6 h-6" />, 
    color: 'bg-rose-500', 
    type: 'custom' 
  },
  
  // 1. 2048 (Lien de ta capture d'écran 1)
  { 
    id: '2048', 
    name: '2048', 
    icon: <Grid3X3 className="w-6 h-6" />, 
    color: 'bg-orange-400', 
    type: 'arcade', 
    url: 'https://codewithfaraz.com/preview/create-your-own-2048-game-online-with-html-css-and-javascript-source-code' 
  },

  // 2. Crossy Road (Lien de ta capture d'écran 6)
  { 
    id: 'crossy', 
    name: 'Crossy Road', 
    icon: <Gamepad2 className="w-6 h-6" />, 
    color: 'bg-blue-500', 
    type: 'arcade', 
    url: 'https://codewithfaraz.com/preview/create-a-crossy-road-game-clone-with-html-css-and-javascript' 
  },

  // 3. Candy Crush (Lien de ta capture d'écran 4)
  { 
    id: 'candy', 
    name: 'Candy Crush', 
    icon: <Candy className="w-6 h-6" />, 
    color: 'bg-pink-500', 
    type: 'arcade', 
    url: 'https://codewithfaraz.com/preview/creating-a-candy-crush-clone-html-css-and-javascript-tutorial-source-code' 
  },

  // 4. Tower Blocks (Lien CodePen de ta capture d'écran 2 - Version plein écran)
  { 
    id: 'tower', 
    name: 'Tower Blocks', 
    icon: <Building className="w-6 h-6" />, 
    color: 'bg-purple-500', 
    type: 'arcade', 
    url: 'https://codepen.io/ste-vg/full/ppLQNW' 
  },

  // 5. Archery Game (Lien de ta capture d'écran 3)
  { 
    id: 'archery', 
    name: 'Tir à l\'arc', 
    icon: <Target className="w-6 h-6" />, 
    color: 'bg-green-500', 
    type: 'arcade', 
    url: 'https://codewithfaraz.com/preview/create-an-archery-game-using-html-css-and-javascript' 
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