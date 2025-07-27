import type { RPS } from '../types/game';

export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;
export const PLAYER_RADIUS_RATIO = 0.07; // 依RWD可調整
export const RPS_LIST = ['rock', 'paper', 'scissors'] as const;
export const ROUND_TIME = 10; // 每回合10秒
export const AI_SPEED = 4; // AI 每次移動最大步長

// RPS變換時間選項
export const RPS_CHANGE_INTERVALS = [3, 5, 10] as const;
export type RPSChangeInterval = typeof RPS_CHANGE_INTERVALS[number];

// 賽點選項
export const WIN_SCORE_OPTIONS = [1, 3, 5, 7] as const;
export type WinScore = typeof WIN_SCORE_OPTIONS[number];

// RPS圖像映射 - 使用人類手勢
export const RPS_EMOJI_MAP: Record<RPS, string> = {
  rock: '✊',      // 石頭手勢
  paper: '✋',     // 布手勢
  scissors: '✌️'   // 剪刀手勢
};

export const RPS_NAME_MAP: Record<RPS, string> = {
  rock: '石頭',
  paper: '布',
  scissors: '剪刀'
};

// 將RPS轉換為emoji
export function getRPSEmoji(rps: RPS): string {
  return RPS_EMOJI_MAP[rps];
}

// 將RPS轉換為中文名稱
export function getRPSName(rps: RPS): string {
  return RPS_NAME_MAP[rps];
} 