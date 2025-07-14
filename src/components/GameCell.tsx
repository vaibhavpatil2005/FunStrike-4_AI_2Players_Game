import React from 'react';
import { CellState } from '../types/game';
import { getPlayerColor } from '../utils/gameLogic';

interface GameCellProps {
  state: CellState;
  isWinning: boolean;
  isAnimating: boolean;
  animationDelay: number;
}

export const GameCell: React.FC<GameCellProps> = ({ 
  state, 
  isWinning, 
  isAnimating, 
  animationDelay 
}) => {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-600 rounded-full p-1 shadow-inner">
      <div className="w-full h-full bg-white rounded-full shadow-sm relative overflow-hidden">
        {state !== 0 && (
          <div
            className={`
              w-full h-full rounded-full shadow-lg transition-all duration-300
              ${getPlayerColor(state)}
              ${isWinning ? 'ring-4 ring-white animate-pulse scale-110 z-10' : ''}
              ${isAnimating ? 'animate-bounce' : ''}
            `}
            style={{
              animationDelay: isAnimating ? `${animationDelay}ms` : '0ms',
              animationDuration: isAnimating ? '600ms' : '300ms',
            }}
          />
        )}
      </div>
    </div>
  );
};