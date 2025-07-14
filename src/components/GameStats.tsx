import React from 'react';
import { Player, PlayerInfo } from '../types/game';
import { getPlayerColor, getPlayerColorClass, getPlayerBgClass } from '../utils/gameLogic';
import { Trophy, Users, RotateCcw, Settings, Bot } from 'lucide-react';

interface GameStatsProps {
  currentPlayer: Player;
  gameStatus: string;
  winner: Player | null;
  isAIGame: boolean;
  players: {
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
  scores: {
    player1: number;
    player2: number;
    draws: number;
  };
  onReset: () => void;
  onNewGame: () => void;
  onBackToSetup: () => void;
}

export const GameStats: React.FC<GameStatsProps> = ({
  currentPlayer,
  gameStatus,
  winner,
  isAIGame,
  players,
  scores,
  onReset,
  onNewGame,
  onBackToSetup,
}) => {
  const getCurrentPlayerName = (): string => {
    return currentPlayer === 1 ? players.player1.name : players.player2.name;
  };

  const getWinnerName = (): string => {
    if (!winner) return '';
    return winner === 1 ? players.player1.name : players.player2.name;
  };

  const getStatusMessage = (): string => {
    if (gameStatus === 'won' && winner) {
      if (isAIGame && winner === 2) {
        return `🤖 Computer Wins!`;
      }
      return `🎉 ${getWinnerName()} Wins!`;
    }
    if (gameStatus === 'draw') {
      return "🤝 It's a Draw!";
    }
    if (isAIGame && currentPlayer === 2) {
      return "🤖 Computer's Turn";
    }
    return `${getCurrentPlayerName()}'s Turn`;
  };

  const getStatusColor = (): string => {
    if (gameStatus === 'won' && winner) {
      return getPlayerColorClass(winner);
    }
    if (gameStatus === 'draw') {
      return 'text-gray-600';
    }
    return getPlayerColorClass(currentPlayer);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Current Status */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {gameStatus === 'playing' && (
            <div className={`w-6 h-6 rounded-full ${getPlayerColor(currentPlayer)}`} />
          )}
          {gameStatus === 'won' && <Trophy className="w-6 h-6 text-yellow-500" />}
          {gameStatus === 'draw' && <Users className="w-6 h-6 text-gray-500" />}
        </div>
        <h2 className={`text-xl sm:text-2xl font-bold ${getStatusColor()}`}>
          {getStatusMessage()}
        </h2>
      </div>

      {/* Player Names */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-xl ${getPlayerBgClass(1)} ${currentPlayer === 1 ? 'ring-2 ring-red-300' : ''}`}>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700 text-sm">{players.player1.name}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{scores.player1}</div>
        </div>
        
        <div className={`p-3 rounded-xl ${getPlayerBgClass(2)} ${currentPlayer === 2 ? 'ring-2 ring-yellow-300' : ''}`}>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <div className="flex items-center space-x-1">
              <span className="font-medium text-yellow-700 text-sm">{players.player2.name}</span>
              {isAIGame && <Bot className="w-3 h-3 text-yellow-600" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{scores.player2}</div>
        </div>
      </div>

      {/* Draws */}
      <div className="text-center bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-600 text-sm">Draws</span>
        </div>
        <div className="text-2xl font-bold text-gray-600">{scores.draws}</div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Reset Board</span>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onNewGame}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-xl transition-colors duration-200 text-sm"
          >
            New Game
          </button>
          
          <button
            onClick={onBackToSetup}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-1 text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};