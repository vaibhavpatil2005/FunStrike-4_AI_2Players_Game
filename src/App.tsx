import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { PlayerSetup } from './components/PlayerSetup';
import { GameBoard } from './components/GameBoard';
import { GameStats } from './components/GameStats';
import { GameHeader } from './components/GameHeader';
import { CanvasAIGame } from './components/CanvasAIGame';
import { GameState, Player } from './types/game';
import { getAdvancedAIMove } from './utils/advancedAI';
import {
  createInitialGameState,
  isValidMove,
  makeMove,
  checkWin,
  isBoardFull,
  getLowestEmptyRow,
} from './utils/gameLogic';

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCanvasAI, setShowCanvasAI] = useState(false);

  const handleStartGame = useCallback((player1Name: string, player2Name: string, isAI: boolean = false) => {
    // If AI mode is selected, show the canvas AI game instead
    if (isAI) {
      setShowCanvasAI(true);
      return;
    }
    
    const newGameState = createInitialGameState(player1Name, player2Name);
    newGameState.isAIGame = isAI;
    newGameState.status = 'playing';
    setGameState(newGameState);
    setIsAnimating(false);
  }, []);

  const handleColumnClick = useCallback((col: number) => {
    console.log(`Column click received: ${col}, current player: ${gameState.currentPlayer}, status: ${gameState.status}`);
    
    // Prevent human clicks during AI turn
    if (gameState.isAIGame && gameState.currentPlayer === 2) {
      console.log('Blocking human click during AI turn');
      return;
    }
    
    if (gameState.status !== 'playing' || !isValidMove(gameState.board, col) || isAnimating) {
      console.log('Move rejected:', { 
        status: gameState.status, 
        validMove: isValidMove(gameState.board, col), 
        isAnimating 
      });
      return;
    }

    console.log('Processing move...');
    setIsAnimating(true);

    // Add a small delay to show the drop animation
    setTimeout(() => {
      const row = getLowestEmptyRow(gameState.board, col);
      const newBoard = makeMove(gameState.board, col, gameState.currentPlayer);
      const lastMove = { row, col };
      
      console.log('Move made:', { row, col, player: gameState.currentPlayer });
      
      const { isWin, winningCells } = checkWin(newBoard, lastMove);
      
      let newStatus = gameState.status;
      let winner = gameState.winner;
      let newScores = { ...gameState.scores };
      
      if (isWin) {
        newStatus = 'won';
        winner = gameState.currentPlayer;
        if (gameState.currentPlayer === 1) {
          newScores.player1++;
        } else {
          newScores.player2++;
        }
        console.log(`Player ${gameState.currentPlayer} wins!`);
      } else if (isBoardFull(newBoard)) {
        newStatus = 'draw';
        newScores.draws++;
        console.log('Game is a draw!');
      }

      const nextPlayer = isWin ? gameState.currentPlayer : (gameState.currentPlayer === 1 ? 2 : 1);
      console.log('Next player:', nextPlayer);

      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer,
        status: newStatus,
        winner,
        winningCells: winningCells.map(pos => ({ row: pos.row, col: pos.col })),
        scores: newScores,
      }));

      setIsAnimating(false);
    }, 400);
  }, [gameState, isAnimating]);

  // Handle AI moves automatically
  useEffect(() => {
    if (!gameState.isAIGame || gameState.currentPlayer !== 2 || gameState.status !== 'playing') {
      return;
    }
    
    console.log('AI turn - making move...');
    
    // Add a small delay to make AI moves feel more natural
    const aiMoveTimer = setTimeout(() => {
      if (gameState.isAIGame && gameState.currentPlayer === 2 && gameState.status === 'playing') {
        getAdvancedAIMove(gameState.board).then((aiCol) => {
          console.log(`AI choosing column: ${aiCol}`);
          
          if (aiCol !== -1 && isValidMove(gameState.board, aiCol)) {
            console.log('AI making move to column:', aiCol);
            handleColumnClick(aiCol);
          }
        });
      }
    }, 800); // Shorter delay for more responsive gameplay
    
    return () => clearTimeout(aiMoveTimer);
  }, [gameState.isAIGame, gameState.currentPlayer, gameState.status, gameState.board, handleColumnClick]);

  const resetBoard = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: Array(6).fill(null).map(() => Array(7).fill(0)),
      currentPlayer: 1,
      status: 'playing',
      winner: null,
      winningCells: [],
    }));
    setIsAnimating(false);
  }, []);

  const newGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: Array(6).fill(null).map(() => Array(7).fill(0)),
      currentPlayer: 1,
      status: 'playing',
      winner: null,
      winningCells: [],
      scores: {
        player1: 0,
        player2: 0,
        draws: 0,
      },
    }));
    setIsAnimating(false);
  }, []);

  const backToSetup = useCallback(() => {
    setGameState(createInitialGameState());
    setIsAnimating(false);
    setShowCanvasAI(false);
  }, []);

  // Show Canvas AI Game
  if (showCanvasAI) {
    return <CanvasAIGame onBackToSetup={backToSetup} />;
  }

  // Show player setup screen
  if (gameState.status === 'setup') {
    return <PlayerSetup onStartGame={handleStartGame} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <GameHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Game Board */}
          <div className="lg:col-span-2 flex justify-center">
            <GameBoard
              board={gameState.board}
              winningCells={gameState.winningCells}
              currentPlayer={gameState.currentPlayer}
              onColumnClick={handleColumnClick}
              gameStatus={gameState.status}
              isAnimating={isAnimating}
              isAIGame={gameState.isAIGame}
            />
          </div>
          
          {/* Game Stats */}
          <div className="lg:col-span-1">
            <GameStats
              currentPlayer={gameState.currentPlayer}
              gameStatus={gameState.status}
              winner={gameState.winner}
              isAIGame={gameState.isAIGame}
              players={gameState.players}
              scores={gameState.scores}
              onReset={resetBoard}
              onNewGame={newGame}
              onBackToSetup={backToSetup}
            />
          </div>
        </div>

        {/* Game Instructions */}
        <div className="mt-8 sm:mt-12 bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">How to Play</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎯 Objective</h4>
              <p className="text-sm sm:text-base">Be the first to connect four of your discs in a row - horizontally, vertically, or diagonally!</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎮 How to Play</h4>
              <p className="text-sm sm:text-base">Click on any column to drop your disc. Discs fall to the lowest available position in that column.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🏆 Winning</h4>
              <p className="text-sm sm:text-base">Connect four discs in any direction to win. Winning discs will be highlighted with a pulsing animation!</p>
            </div>
            <div>
              <h4 className="font-semibred text-gray-800 mb-2">🔄 Game Controls</h4>
              <p className="text-sm sm:text-base">Use "Reset Board" to clear the current game, "New Game" to reset scores, or "Setup" to change players or game mode.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;