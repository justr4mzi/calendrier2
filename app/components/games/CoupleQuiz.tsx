import React, { useState } from 'react';
import { X, Heart, Trophy, RefreshCcw } from 'lucide-react';

// --- TES QUESTIONS ICI ---
const QUESTIONS = [
  {
    question: "Où avons-nous échangé notre premier baiser ?",
    options: ["À confluence", "Au parc", "Vers chez toi", "Au Arts appliqués"],
    correct: 2 
  },
  {
    question: "Quelle est ma couleur préférée ?",
    options: ["Bleu", "Rouge", "Violet", "Rose"],
    correct: 3
  },
  {
    question: "Quelle est notre date d'anniversaire ?",
    options: ["15 mars", "9 mars", "8 mars", "12 mars"],
    correct: 3
  },
  {
    question: "Quel est mon plat préféré que tu cuisines ?",
    options: ["Le riz au curry", "Jsp", "Tu sais cuisiné c'est deja c pas mal", "Nan je rigole"],
    correct: 1
  },
  {
    question: "Quel est le surnom que je te donne le plus ?",
    options: ["Mon amour", "Ma Déborah", "Mon cœur", "Ma Chérie"],
    correct: 4
  }
];

const CoupleQuiz = ({ onClose }: { onClose: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === QUESTIONS[currentQuestion].correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion + 1 < QUESTIONS.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setShowScore(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {/* === EN-TÊTE CORRIGÉ === */}
        {/* Avant : Le bouton fermer était en absolute et écrasait le cœur */}
        {/* Maintenant : On utilise Flexbox pour les espacer proprement */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <span className="text-rose-500 font-bold text-sm uppercase tracking-wider block">
                    Question {currentQuestion + 1}/{QUESTIONS.length}
                </span>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Le cœur est à gauche du bouton fermer */}
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
                
                {/* Le bouton fermer est bien séparé */}
                <button onClick={onClose} className="text-gray-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-gray-100">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {showScore ? (
          <div className="text-center py-8 animate-in zoom-in">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Terminé !</h2>
            <p className="text-lg text-gray-600 mb-6">Tu as obtenu :</p>
            <div className="text-5xl font-bold text-rose-500 mb-6">{score} / {QUESTIONS.length}</div>
            
            <p className="italic text-gray-500 mb-8">
              {score === QUESTIONS.length ? "Parfait ! Tu me connais par cœur ❤️" : "Pas mal, mais tu peux faire mieux ! 😘"}
            </p>
            
            <div className="flex flex-col gap-3">
                <button 
                  onClick={resetQuiz}
                  className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 transition-all w-full"
                >
                  <RefreshCcw className="w-4 h-4" /> Recommencer
                </button>
                <button 
                  onClick={onClose}
                  className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all w-full"
                >
                  Quitter
                </button>
            </div>
          </div>
        ) : (
          <div>
             <h2 className="text-xl font-bold text-gray-800 mb-8 min-h-[60px] leading-tight">
               {QUESTIONS[currentQuestion].question}
             </h2>

             <div className="space-y-3">
               {QUESTIONS[currentQuestion].options.map((option, index) => {
                 let buttonStyle = "bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent";
                 
                 if (isAnswered) {
                   if (index === QUESTIONS[currentQuestion].correct) {
                       buttonStyle = "bg-green-100 text-green-800 border-green-500 font-bold";
                   } else if (index === selectedOption) {
                       buttonStyle = "bg-red-100 text-red-800 border-red-500";
                   } else {
                       buttonStyle = "bg-gray-50 text-gray-400 opacity-50";
                   }
                 }

                 return (
                   <button
                     key={index}
                     onClick={() => handleAnswer(index)}
                     disabled={isAnswered}
                     className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 transform active:scale-98 ${buttonStyle}`}
                   >
                     {option}
                   </button>
                 );
               })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoupleQuiz;