import { CellState, Player, Position } from '../types/game';
import { ROWS, COLS, checkWin, getLowestEmptyRow, isValidMove } from './gameLogic';

export interface AIMove {
  col: number;
  score: number;
}

// AI difficulty levels
export const AI_DIFFICULTY = {
  EASY: 3,
  MEDIUM: 5,
  HARD: 7
} as const;

/**
 * Get the best move for the AI using minimax algorithm with alpha-beta pruning
 */
export const getAIMove = (board: CellState[][], difficulty: number = AI_DIFFICULTY.MEDIUM): number => {
  const availableMoves = getAvailableMoves(board);
  
  if (availableMoves.length === 0) {
    return -1;
  }

  // First move - prefer center columns
  if (isFirstMove(board)) {
    const centerCols = [3, 2, 4, 1, 5, 0, 6];
    for (const col of centerCols) {
      if (isValidMove(board, col)) {
        return col;
      }
    }
  }

  // Check for immediate winning move
  for (const col of availableMoves) {
    const testBoard = makeTestMove(board, col, 2);
    const row = getLowestEmptyRow(board, col);
    if (row !== -1) {
      const { isWin } = checkWin(testBoard, { row, col });
      if (isWin) {
        return col;
      }
    }
  }

  // Check for blocking opponent's winning move
  for (const col of availableMoves) {
    const testBoard = makeTestMove(board, col, 1);
    const row = getLowestEmptyRow(board, col);
    if (row !== -1) {
      const { isWin } = checkWin(testBoard, { row, col });
      if (isWin) {
        return col;
      }
    }
  }

  // Use minimax for strategic moves
  const bestMove = minimax(board, difficulty, -Infinity, Infinity, true);
  return bestMove.col !== -1 ? bestMove.col : availableMoves[0];
};

/**
 * Minimax algorithm with alpha-beta pruning
 */
const minimax = (
  board: CellState[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): AIMove => {
  const availableMoves = getAvailableMoves(board);
  
  // Terminal conditions
  if (depth === 0 || availableMoves.length === 0) {
    return { col: -1, score: evaluateBoard(board) };
  }

  if (isMaximizing) {
    let maxEval = { col: -1, score: -Infinity };
    
    for (const col of availableMoves) {
      const row = getLowestEmptyRow(board, col);
      if (row === -1) continue;
      
      const newBoard = makeTestMove(board, col, 2);
      const { isWin } = checkWin(newBoard, { row, col });
      
      if (isWin) {
        return { col, score: 1000 + depth };
      }
      
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
      
      if (evaluation.score > maxEval.score) {
        maxEval = { col, score: evaluation.score };
      }
      
      alpha = Math.max(alpha, evaluation.score);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }
    
    return maxEval;
  } else {
    let minEval = { col: -1, score: Infinity };
    
    for (const col of availableMoves) {
      const row = getLowestEmptyRow(board, col);
      if (row === -1) continue;
      
      const newBoard = makeTestMove(board, col, 1);
      const { isWin } = checkWin(newBoard, { row, col });
      
      if (isWin) {
        return { col, score: -1000 - depth };
      }
      
      const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
      
      if (evaluation.score < minEval.score) {
        minEval = { col, score: evaluation.score };
      }
      
      beta = Math.min(beta, evaluation.score);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }
    
    return minEval;
  }
};

/**
 * Evaluate the board position for the AI
 */
const evaluateBoard = (board: CellState[][]): number => {
  let score = 0;
  
  // Evaluate all possible 4-in-a-row positions
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Horizontal
      if (col <= COLS - 4) {
        score += evaluateWindow([
          board[row][col],
          board[row][col + 1],
          board[row][col + 2],
          board[row][col + 3]
        ]);
      }
      
      // Vertical
      if (row <= ROWS - 4) {
        score += evaluateWindow([
          board[row][col],
          board[row + 1][col],
          board[row + 2][col],
          board[row + 3][col]
        ]);
      }
      
      // Diagonal (positive slope)
      if (row <= ROWS - 4 && col <= COLS - 4) {
        score += evaluateWindow([
          board[row][col],
          board[row + 1][col + 1],
          board[row + 2][col + 2],
          board[row + 3][col + 3]
        ]);
      }
      
      // Diagonal (negative slope)
      if (row >= 3 && col <= COLS - 4) {
        score += evaluateWindow([
          board[row][col],
          board[row - 1][col + 1],
          board[row - 2][col + 2],
          board[row - 3][col + 3]
        ]);
      }
    }
  }
  
  return score;
};

/**
 * Evaluate a window of 4 cells
 */
const evaluateWindow = (window: CellState[]): number => {
  let score = 0;
  const aiCount = window.filter(cell => cell === 2).length;
  const humanCount = window.filter(cell => cell === 1).length;
  const emptyCount = window.filter(cell => cell === 0).length;
  
  if (aiCount === 4) {
    score += 100;
  } else if (aiCount === 3 && emptyCount === 1) {
    score += 10;
  } else if (aiCount === 2 && emptyCount === 2) {
    score += 2;
  }
  
  if (humanCount === 3 && emptyCount === 1) {
    score -= 80;
  } else if (humanCount === 2 && emptyCount === 2) {
    score -= 5;
  }
  
  return score;
};

/**
 * Get all available moves (columns that aren't full)
 */
const getAvailableMoves = (board: CellState[][]): number[] => {
  const moves: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(board, col)) {
      moves.push(col);
    }
  }
  return moves;
};

/**
 * Check if this is the first move of the game
 */
const isFirstMove = (board: CellState[][]): boolean => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== 0) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Make a test move without modifying the original board
 */
const makeTestMove = (board: CellState[][], col: number, player: Player): CellState[][] => {
  const newBoard = board.map(row => [...row]);
  const row = getLowestEmptyRow(newBoard, col);
  if (row !== -1) {
    newBoard[row][col] = player;
  }
  return newBoard;
};