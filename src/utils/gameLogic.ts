import { CellState, Player, GameState, Position, WinDirection, PlayerInfo } from '../types/game';

export const ROWS = 6;
export const COLS = 7;

export const createEmptyBoard = (): CellState[][] => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
};

export const createInitialGameState = (player1Name: string = 'Player 1', player2Name: string = 'Player 2'): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 1,
  status: 'setup',
  winner: null,
  winningCells: [],
  isAIGame: false,
  scores: {
    player1: 0,
    player2: 0,
    draws: 0,
  },
  players: {
    player1: { name: player1Name, color: 'red' },
    player2: { name: player2Name, color: 'yellow' },
  },
});

export const getLowestEmptyRow = (board: CellState[][], col: number): number => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      return row;
    }
  }
  return -1;
};

export const isValidMove = (board: CellState[][], col: number): boolean => {
  return col >= 0 && col < COLS && getLowestEmptyRow(board, col) !== -1;
};

export const makeMove = (board: CellState[][], col: number, player: Player): CellState[][] => {
  const newBoard = board.map(row => [...row]);
  const row = getLowestEmptyRow(newBoard, col);
  if (row !== -1) {
    newBoard[row][col] = player;
  }
  return newBoard;
};

export const checkWin = (board: CellState[][], lastMove: Position): { isWin: boolean; winningCells: Position[]; direction?: WinDirection } => {
  const player = board[lastMove.row][lastMove.col];
  if (player === 0) return { isWin: false, winningCells: [] };

  const directions: { dir: WinDirection; deltas: [number, number][] }[] = [
    { dir: 'horizontal', deltas: [[0, -1], [0, 1]] },
    { dir: 'vertical', deltas: [[-1, 0], [1, 0]] },
    { dir: 'diagonal-left', deltas: [[-1, -1], [1, 1]] },
    { dir: 'diagonal-right', deltas: [[-1, 1], [1, -1]] },
  ];

  for (const { dir, deltas } of directions) {
    const winningCells = [lastMove];
    
    for (const [deltaRow, deltaCol] of deltas) {
      let row = lastMove.row + deltaRow;
      let col = lastMove.col + deltaCol;
      
      while (
        row >= 0 && row < ROWS &&
        col >= 0 && col < COLS &&
        board[row][col] === player
      ) {
        winningCells.push({ row, col });
        row += deltaRow;
        col += deltaCol;
      }
    }
    
    if (winningCells.length >= 4) {
      return { isWin: true, winningCells, direction: dir };
    }
  }
  
  return { isWin: false, winningCells: [] };
};

export const isBoardFull = (board: CellState[][]): boolean => {
  return board[0].every(cell => cell !== 0);
};

export const getPlayerColor = (player: Player): string => {
  return player === 1 ? 'bg-red-500' : 'bg-yellow-400';
};

export const getPlayerColorClass = (player: Player): string => {
  return player === 1 ? 'text-red-600' : 'text-yellow-600';
};

export const getPlayerBgClass = (player: Player): string => {
  return player === 1 ? 'bg-red-50' : 'bg-yellow-50';
};