import React, { useState, useEffect } from 'react';
import { GameCell } from './GameCell';
import { CellState, Player, Position } from '../types/game';
import { ROWS, COLS, getPlayerColor } from '../utils/gameLogic';

interface GameBoardProps {
  board: CellState[][];
  winningCells: Position[];
  currentPlayer: Player;
  onColumnClick: (col: number) => void;
  gameStatus: string;
  isAnimating: boolean;
  isAIGame: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  winningCells,
  currentPlayer,
  onColumnClick,
  gameStatus,
  isAnimating,
  isAIGame,
}) => {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setAnimatingCells(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const isWinningCell = (row: number, col: number): boolean => {
    return winningCells.some(cell => cell.row === row && cell.col === col);
  };

  const isCellAnimating = (row: number, col: number): boolean => {
    return animatingCells.has(`${row}-${col}`);
  };

  const handleColumnClick = (col: number) => {
    console.log(`Column ${col} clicked, game status: ${gameStatus}`);
    
    // Prevent clicks during AI turn
    if (isAIGame && currentPlayer === 2) {
      console.log('Blocking click during AI turn');
      return;
    }
    
    if (gameStatus === 'playing' && !isAnimating) {
      // Find the row where the disc will land for animation
      for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) {
          setAnimatingCells(new Set([`${row}-${col}`]));
          break;
        }
      }
      onColumnClick(col);
    }
  };

  const canDropInColumn = (col: number): boolean => {
    return gameStatus === 'playing' && 
           board[0][col] === 0 && 
           !isAnimating && 
           !(isAIGame && currentPlayer === 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Column hover indicators */}
      <div className="flex space-x-1">
        {Array.from({ length: COLS }, (_, col) => (
          <div
            key={col}
            className={`
              w-12 h-8 sm:w-14 sm:h-8 md:w-16 md:h-8 flex items-center justify-center rounded-t-lg cursor-pointer
              transition-all duration-200 transform
              ${hoveredColumn === col && canDropInColumn(col) 
                ? 'bg-gray-200 scale-105' 
                : 'bg-transparent hover:bg-gray-100'
              }
              ${!canDropInColumn(col) ? 'cursor-not-allowed opacity-50' : ''}
            `}
            onMouseEnter={() => canDropInColumn(col) && setHoveredColumn(col)}
            onMouseLeave={() => setHoveredColumn(null)}
            onClick={() => handleColumnClick(col)}
          >
            {hoveredColumn === col && canDropInColumn(col) && (
              <div 
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full opacity-70 animate-pulse
                  ${getPlayerColor(currentPlayer)}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Game grid */}
      <div className="bg-blue-700 p-3 sm:p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-7 gap-1">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="cursor-pointer"
                onClick={() => handleColumnClick(colIndex)}
              >
                <GameCell
                  state={cell}
                  isWinning={isWinningCell(rowIndex, colIndex)}
                  isAnimating={isCellAnimating(rowIndex, colIndex)}
                  animationDelay={rowIndex * 100}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Game legs/base */}
      <div className="flex justify-between w-full max-w-xs sm:max-w-sm md:max-w-md">
        <div className="w-3 h-8 sm:w-4 sm:h-10 md:w-4 md:h-12 bg-blue-800 rounded-b-lg shadow-lg"></div>
        <div className="w-3 h-8 sm:w-4 sm:h-10 md:w-4 md:h-12 bg-blue-800 rounded-b-lg shadow-lg"></div>
      </div>
    </div>
  );
};