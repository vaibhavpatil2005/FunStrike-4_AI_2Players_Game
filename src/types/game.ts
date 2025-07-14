export type Player = 1 | 2;
export type CellState = 0 | Player;
export type GameStatus = 'setup' | 'playing' | 'won' | 'draw';
export type WinDirection = 'horizontal' | 'vertical' | 'diagonal-left' | 'diagonal-right';

export interface PlayerInfo {
  name: string;
  color: 'red' | 'yellow';
}

export interface GameState {
  board: CellState[][];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: Position[];
  isAIGame: boolean;
  scores: {
    player1: number;
    player2: number;
    draws: number;
  };
  players: {
    player1: PlayerInfo;
    player2: PlayerInfo;
  };
}

export interface Position {
  row: number;
  col: number;
}

export interface WinResult {
  isWin: boolean;
  winningCells: Position[];
  direction?: WinDirection;
}