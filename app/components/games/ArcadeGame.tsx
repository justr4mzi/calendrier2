import React, { useEffect } from 'react';
import { X } from 'lucide-react'; // J'ai retiré ExternalLink des imports car on ne l'utilise plus

interface ArcadeGameProps {
  url: string;
  title: string;
  onClose: () => void;
}

const ArcadeGame = ({ url, title, onClose }: ArcadeGameProps) => {
  
  // Bloquer le scroll de la page quand le jeu est ouvert
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-0 md:p-4 overscroll-none">
      
      <div className="bg-white rounded-none md:rounded-3xl w-full h-full md:h-[90vh] md:max-w-4xl flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Header du jeu SIMPLIFIÉ */}
        <div className="bg-rose-500 p-3 flex justify-between items-center text-white shrink-0 z-10">
            <h3 className="font-bold text-lg flex items-center gap-2">🎮 {title}</h3>
            
            {/* J'ai supprimé le bouton lien externe ici */}
            <div className="flex gap-2">
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
        
        {/* Zone de jeu */}
        <div className="flex-1 bg-black relative w-full h-full overflow-hidden">
            <iframe 
                src={url} 
                className="absolute inset-0 w-full h-full border-0 touch-none"
                style={{ touchAction: 'none' }}
                allow="autoplay; fullscreen; gyroscope; accelerometer"
                title={title}
            />
        </div>
      </div>
    </div>
  );
};

export default ArcadeGame;