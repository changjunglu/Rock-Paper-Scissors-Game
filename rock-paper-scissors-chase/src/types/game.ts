export type RPS = 'rock' | 'paper' | 'scissors';

export interface Player {
  id: 'player' | 'ai';
  x: number;
  y: number;
  radius: number;
  rps: RPS;
  score: number;
}

export interface GameState {
  player: Player;
  ai: Player;
  status: 'playing' | 'paused' | 'ended';
  timer: number;
  round: number;
  winner?: 'player' | 'ai' | 'draw';
  rpsChangeTimer: number; // RPS變換倒計時
  winScore: number; // 勝利所需分數
} 