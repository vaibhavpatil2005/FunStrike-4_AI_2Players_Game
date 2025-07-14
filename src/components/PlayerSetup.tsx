import React, { useState } from 'react';
import { Users, Play, Gamepad2, Bot, User } from 'lucide-react';

interface PlayerSetupProps {
  onStartGame: (player1Name: string, player2Name: string, isAI?: boolean) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [gameMode, setGameMode] = useState<'human' | 'ai'>('human');
  const [errors, setErrors] = useState({ player1: '', player2: '' });

  const validateAndStart = () => {
    const newErrors = { player1: '', player2: '' };
    
    if (!player1Name.trim()) {
      newErrors.player1 = 'Player 1 name is required';
    } else if (player1Name.trim().length < 2) {
      newErrors.player1 = 'Name must be at least 2 characters';
    }
    
    if (gameMode === 'human' && !player2Name.trim()) {
      newErrors.player2 = 'Player 2 name is required';
    } else if (gameMode === 'human' && player2Name.trim().length < 2) {
      newErrors.player2 = 'Name must be at least 2 characters';
    }
    
    if (gameMode === 'human' && player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
      newErrors.player1 = 'Player names must be different';
      newErrors.player2 = 'Player names must be different';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.player1 && !newErrors.player2) {
      const finalPlayer2Name = gameMode === 'ai' ? 'Computer' : player2Name.trim();
      onStartGame(player1Name.trim(), finalPlayer2Name, gameMode === 'ai');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndStart();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="w-10 h-10 text-blue-600" />
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Strike 4</h1>
          <p className="text-gray-600">Enter player names to start the game</p>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Choose Game Mode</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGameMode('human')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                gameMode === 'human'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Users className="w-8 h-8" />
              <span className="font-medium">2 Players</span>
              <span className="text-xs text-center">Play with a friend</span>
            </button>
            
            <button
              type="button"
              onClick={() => setGameMode('ai')}
              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                gameMode === 'ai'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <Bot className="w-8 h-8" />
              <span className="font-medium">vs Computer</span>
              <span className="text-xs text-center">Canvas-based AI Game</span>
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>{gameMode === 'ai' ? 'Your Name' : 'Player 1'} (Red)</span>
            </label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={gameMode === 'ai' ? 'Enter your name' : 'Enter Player 1 name'}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${
                errors.player1 ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              maxLength={20}
            />
            {errors.player1 && (
              <p className="text-red-500 text-sm mt-1">{errors.player1}</p>
            )}
          </div>

          {gameMode === 'human' && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <span>Player 2 (Yellow)</span>
            </label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Player 2 name"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 ${
                errors.player2 ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              maxLength={20}
            />
            {errors.player2 && (
              <p className="text-red-500 text-sm mt-1">{errors.player2}</p>
            )}
          </div>
          )}

          {gameMode === 'ai' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">Computer Opponent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-green-600">The computer will play as Player 2 (Yellow)</span>
            </div>
          </div>
          )}

          <button
            onClick={validateAndStart}
            disabled={!player1Name.trim() || (gameMode === 'human' && !player2Name.trim())}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
          >
            <Play className="w-5 h-5" />
            <span>{gameMode === 'ai' ? 'Start Game vs AI' : 'Start Game'}</span>
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Game Rules</span>
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Connect 4 discs in a row to win</li>
            <li>• Drop discs by clicking columns</li>
            <li>• Win horizontally, vertically, or diagonally</li>
            <li>• Take turns until someone wins</li>
            <li>• AI opponent provides challenging gameplay</li>
          </ul>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Developer </span>
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Name :  [Vaibhav Patil]</li>
            <li>• Contact : 7805826387</li>
          <li>• Email : vaibhavpatil843541@gmail.com</li>
          <li>• GitHub : <a href="https://github.com/vaibhavpatil2005/" className="underline">Github/vaibhavpatil</a></li>
          </ul>
          <br />
         
        </div>
      </div>
    </div>
  );
};