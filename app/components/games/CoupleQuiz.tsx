import React, { useState } from 'react';
import { X, Heart, Trophy, RefreshCcw } from 'lucide-react';

// --- CONFIGURATION DES QUESTIONS ICI ---
const QUESTIONS = [
  {
    question: "Où avons-nous échangé notre premier baiser ?",
    options: ["Au cinéma", "Dans un parc", "Devant chez toi", "En voiture"],
    correct: 2 // Index de la bonne réponse (0 = la première, 1 = la deuxième...)
  },
  {
    question: "Quelle est ma couleur préférée ?",
    options: ["Bleu", "Rouge", "Vert", "Rose"],
    correct: 3
  },
  {
    question: "Quelle est notre date d'anniversaire ?",
    options: ["14 Février", "1er Janvier", "Ta date ici", "Une autre date"],
    correct: 2
  },
  {
    question: "Quel est mon plat préféré que tu cuisines ?",
    options: ["Les pâtes", "La pizza", "Le couscous", "Rien, je commande"],
    correct: 0
  },
  {
    question: "Quel est le surnom que je te donne le plus ?",
    options: ["Bébé", "Princesse", "Mon cœur", "Chérie"],
    correct: 1
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
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500">
          <X className="w-6 h-6" />
        </button>

        {showScore ? (
          <div className="text-center py-8 animate-in zoom-in">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Terminé !</h2>
            <p className="text-lg text-gray-600 mb-6">Tu as obtenu :</p>
            <div className="text-5xl font-bold text-rose-500 mb-6">{score} / {QUESTIONS.length}</div>
            
            <p className="italic text-gray-500 mb-8">
              {score === QUESTIONS.length ? "Parfait ! Tu me connais par cœur ❤️" : "Pas mal, mais tu peux faire mieux ! 😘"}
            </p>
            
            <button 
              onClick={resetQuiz}
              className="bg-rose-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto hover:bg-rose-600 transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Recommencer
            </button>
          </div>
        ) : (
          <div>
             <div className="flex justify-between items-center mb-6">
                <span className="text-rose-500 font-bold text-sm uppercase tracking-wider">Question {currentQuestion + 1}/{QUESTIONS.length}</span>
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
             </div>

             <h2 className="text-xl font-bold text-gray-800 mb-8 min-h-[60px]">
               {QUESTIONS[currentQuestion].question}
             </h2>

             <div className="space-y-3">
               {QUESTIONS[currentQuestion].options.map((option, index) => {
                 let buttonStyle = "bg-gray-100 hover:bg-gray-200 text-gray-700";
                 if (isAnswered) {
                   if (index === QUESTIONS[currentQuestion].correct) buttonStyle = "bg-green-500 text-white ring-2 ring-green-300";
                   else if (index === selectedOption) buttonStyle = "bg-red-500 text-white";
                   else buttonStyle = "bg-gray-100 text-gray-400 opacity-50";
                 }

                 return (
                   <button
                     key={index}
                     onClick={() => handleAnswer(index)}
                     disabled={isAnswered}
                     className={`w-full p-4 rounded-xl text-left font-semibold transition-all duration-200 transform active:scale-98 ${buttonStyle}`}
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