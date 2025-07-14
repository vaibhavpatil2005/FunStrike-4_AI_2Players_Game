import { CellState, Player, Position } from '../types/game';
import { ROWS, COLS, checkWin, getLowestEmptyRow, isValidMove } from './gameLogic';

// Zobrist hashing for transposition table
let zobristKeys: number[][][] = [];
const transpositionTable = new Map<number, { score: number; depth: number }>();
let killerMoves: { [depth: number]: number } = {};
let historyTable: { [col: number]: number } = {};

/**
 * Initialize Zobrist keys for hashing
 */
function initZobrist(): void {
  zobristKeys = [];
  for (let row = 0; row < ROWS; row++) {
    zobristKeys[row] = [];
    for (let col = 0; col < COLS; col++) {
      zobristKeys[row][col] = [
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
      ];
    }
  }
}

/**
 * Compute Zobrist hash for board position
 */
function computeZobristHash(board: CellState[][]): number {
  let hash = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== 0) {
        hash ^= zobristKeys[row][col][board[row][col]];
      }
    }
  }
  return hash;
}

/**
 * Check for three in a row threats
 */
function checkThreeInRow(player: Player, board: CellState[][]): number[] {
  const threats: number[] = [];
  
  // Horizontal threats
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      let count = 0;
      let emptyCol = -1;
      for (let i = 0; i < 4; i++) {
        if (board[row][col + i] === player) {
          count++;
        } else if (board[row][col + i] === 0) {
          emptyCol = col + i;
        }
      }
      if (count === 3 && emptyCol !== -1 && (row === ROWS - 1 || board[row + 1][emptyCol] !== 0)) {
        threats.push(emptyCol);
      }
    }
  }
  
  // Vertical threats
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 4; row++) {
      let count = 0;
      let emptyRow = -1;
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col] === player) {
          count++;
        } else if (board[row + i][col] === 0) {
          emptyRow = row + i;
        }
      }
      if (count === 3 && emptyRow !== -1) {
        threats.push(col);
      }
    }
  }
  
  // Diagonal threats (positive slope)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      let count = 0;
      let emptyCol = -1;
      let emptyRow = -1;
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col + i] === player) {
          count++;
        } else if (board[row + i][col + i] === 0) {
          emptyRow = row + i;
          emptyCol = col + i;
        }
      }
      if (count === 3 && emptyCol !== -1 && (emptyRow === ROWS - 1 || board[emptyRow + 1][emptyCol] !== 0)) {
        threats.push(emptyCol);
      }
    }
  }
  
  // Diagonal threats (negative slope)
  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      let count = 0;
      let emptyCol = -1;
      let emptyRow = -1;
      for (let i = 0; i < 4; i++) {
        if (board[row - i][col + i] === player) {
          count++;
        } else if (board[row - i][col + i] === 0) {
          emptyRow = row - i;
          emptyCol = col + i;
        }
      }
      if (count === 3 && emptyCol !== -1 && (emptyRow === ROWS - 1 || board[emptyRow + 1][emptyCol] !== 0)) {
        threats.push(emptyCol);
      }
    }
  }
  
  return threats;
}

/**
 * Simulate a move on the board
 */
function simulateMove(board: CellState[][], col: number, player: Player): CellState[][] {
  const newBoard = board.map(row => [...row]);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (newBoard[row][col] === 0) {
      newBoard[row][col] = player;
      break;
    }
  }
  return newBoard;
}

/**
 * Get all valid columns
 */
function getValidColumns(board: CellState[][]): number[] {
  const valid: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(board, col)) {
      valid.push(col);
    }
  }
  return valid;
}

/**
 * Evaluate board position
 */
function evaluateBoard(board: CellState[][]): number {
  // Check for immediate wins
  const aiWin = checkWin(board, { row: 0, col: 0 });
  if (aiWin.isWin && board.flat().includes(2)) return Infinity;
  
  const humanWin = checkWin(board, { row: 0, col: 0 });
  if (humanWin.isWin && board.flat().includes(1)) return -Infinity;
  
  let score = 0;
  
  // Center column preference
  for (let col = 0; col < COLS; col++) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] !== 0) {
        if (board[row][col] === 2) {
          score += (col === 3 ? 100 : 50);
          score += (row % 2 === 1 ? 50 : 0);
        } else if (board[row][col] === 1) {
          score -= (col === 3 ? 100 : 50);
          score -= (row % 2 === 1 ? 50 : 0);
        }
        break;
      }
    }
  }
  
  // Evaluate potential connections
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  let aiThreats = 0;
  let humanThreats = 0;
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dr, dc] of directions) {
        let aiCount = 0;
        let humanCount = 0;
        let emptyCount = 0;
        let openEnds = 0;
        let lineValid = true;
        
        for (let i = -1; i <= 4; i++) {
          const r = row + i * dr;
          const c = col + i * dc;
          
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
          
          if (i === -1 || i === 4) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === 0) {
              openEnds++;
            }
            continue;
          }
          
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
            lineValid = false;
            break;
          }
          
          if (board[r][c] === 2) aiCount++;
          else if (board[r][c] === 1) humanCount++;
          else emptyCount++;
        }
        
        if (!lineValid) continue;
        
        if (aiCount >= 2 && emptyCount >= 1 && openEnds > 0) aiThreats++;
        if (humanCount >= 2 && emptyCount >= 1 && openEnds > 0) humanThreats++;
        
        if (aiCount === 3 && emptyCount === 1 && openEnds > 0) score += 1000;
        if (humanCount === 3 && emptyCount === 1 && openEnds > 0) score -= 10000;
        if (aiCount === 2 && emptyCount === 2 && openEnds === 2) score += 200;
        if (humanCount === 2 && emptyCount === 2 && openEnds === 2) score -= 200;
        if (aiCount === 1 && emptyCount === 3 && openEnds === 2) score += 50;
        if (humanCount === 1 && emptyCount === 3 && openEnds === 2) score -= 50;
      }
    }
  }
  
  if (aiThreats >= 2) score += 5000;
  if (humanThreats >= 2) score -= 5000;
  
  return score;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(
  board: CellState[][],
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  currentDepth: number
): number {
  const hash = computeZobristHash(board);
  
  if (transpositionTable.has(hash)) {
    const entry = transpositionTable.get(hash)!;
    if (entry.depth >= depth) return entry.score;
  }
  
  // Check for terminal states
  const aiWin = checkWin(board, { row: 0, col: 0 });
  if (aiWin.isWin && board.flat().includes(2)) return Infinity - currentDepth;
  
  const humanWin = checkWin(board, { row: 0, col: 0 });
  if (humanWin.isWin && board.flat().includes(1)) return -Infinity + currentDepth;
  
  if (getValidColumns(board).length === 0) return 0;
  if (depth === 0) {
    const score = evaluateBoard(board);
    transpositionTable.set(hash, { score, depth });
    return score;
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const col of getValidColumns(board)) {
      const newBoard = simulateMove(board, col, 2);
      const evaluation = minimax(newBoard, depth - 1, false, alpha, beta, currentDepth + 1);
      if (evaluation > maxEval) {
        maxEval = evaluation;
        if (currentDepth === 0) {
          killerMoves[currentDepth] = col;
          historyTable[col] = (historyTable[col] || 0) + depth * depth;
        }
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    transpositionTable.set(hash, { score: maxEval, depth });
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of getValidColumns(board)) {
      const newBoard = simulateMove(board, col, 1);
      const evaluation = minimax(newBoard, depth - 1, true, alpha, beta, currentDepth + 1);
      if (evaluation < minEval) {
        minEval = evaluation;
        if (currentDepth === 0) {
          killerMoves[currentDepth] = col;
          historyTable[col] = (historyTable[col] || 0) + depth * depth;
        }
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    transpositionTable.set(hash, { score: minEval, depth });
    return minEval;
  }
}

/**
 * Get the best AI move using advanced algorithms
 */
export const getAdvancedAIMove = async (board: CellState[][]): Promise<number> => {
  // Initialize if needed
  if (zobristKeys.length === 0) {
    initZobrist();
  }
  
  const validMoves = getValidColumns(board);
  if (validMoves.length === 0) return -1;
  
  let bestMove: number | null = null;
  let bestScore = -Infinity;
  
  // Edge case: Player stacking adjacent columns
  const discCount = board.flat().filter(cell => cell !== 0).length;
  if (discCount === 3 && board[5][2] === 1 && board[4][3] === 2 && board[5][3] === 1) {
    if (isValidMove(board, 1)) bestMove = 1;
    else if (isValidMove(board, 4)) bestMove = 4;
    else bestMove = validMoves[0];
  }
  
  // Check for human threats
  if (!bestMove) {
    const humanThreats = checkThreeInRow(1, board);
    if (humanThreats.length > 0) {
      const blockMove = humanThreats[0];
      if (isValidMove(board, blockMove)) {
        bestMove = blockMove;
      }
    }
  }
  
  // Use minimax if no immediate threat
  if (!bestMove) {
    const startTime = performance.now();
    const maxTime = 1500;
    let depth = 1;
    
    return new Promise((resolve) => {
      const search = setInterval(() => {
        let currentBestMove: number | null = null;
        let currentBestScore = -Infinity;
        
        for (const col of validMoves) {
          const tempBoard = simulateMove(board, col, 2);
          const score = minimax(tempBoard, depth, false, -Infinity, Infinity, 1);
          if (score > currentBestScore) {
            currentBestScore = score;
            currentBestMove = col;
          }
        }
        
        if (currentBestScore > bestScore) {
          bestScore = currentBestScore;
          bestMove = currentBestMove;
        }
        
        depth++;
        
        if (performance.now() - startTime > maxTime || depth > 12 || bestScore === Infinity) {
          clearInterval(search);
          resolve(bestMove || validMoves[0]);
        }
      }, 100);
    });
  }
  
  return bestMove || validMoves[0];
};