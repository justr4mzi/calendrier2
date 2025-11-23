import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ArcadeGameProps {
  url: string;
  title: string;
  onClose: () => void;
}

const ArcadeGame = ({ url, title, onClose }: ArcadeGameProps) => {
  return (
    // MODIFICATION ICI : J'ai enlevé "backdrop-blur-md" pour accélérer les jeux
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-3xl w-full h-full md:h-[90vh] md:max-w-4xl flex flex-col relative overflow-hidden shadow-2xl">
        {/* Header du jeu */}
        <div className="bg-rose-500 p-3 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">🎮 {title}</h3>
            <div className="flex gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Ouvrir dans un nouvel onglet">
                    <ExternalLink className="w-5 h-5" />
                </a>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        {/* Zone de jeu (Iframe) */}
        <div className="flex-1 bg-black relative">
            <iframe 
                src={url} 
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; gyroscope; accelerometer"
                title={title}
            />
        </div>
      </div>
    </div>
  );
};

export default ArcadeGame;