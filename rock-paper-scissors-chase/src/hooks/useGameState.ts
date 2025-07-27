import { useState, useRef, useEffect, useCallback } from 'react';
import type { GameState, Player, RPS } from '../types/game';
import { ARENA_WIDTH, ARENA_HEIGHT, PLAYER_RADIUS_RATIO, RPS_LIST, ROUND_TIME } from '../utils/constants';
import type { RPSChangeInterval, WinScore } from '../utils/constants';
import { isCollide, isRPSWin } from '../utils/gameLogic';

function getRandomRPS(): RPS {
  return RPS_LIST[Math.floor(Math.random() * RPS_LIST.length)];
}

function getInitialPlayer(id: 'player' | 'ai'): Player {
  return {
    id,
    x: id === 'player' ? ARENA_WIDTH * 0.25 : ARENA_WIDTH * 0.75,
    y: ARENA_HEIGHT / 2,
    radius: ARENA_WIDTH * PLAYER_RADIUS_RATIO,
    rps: getRandomRPS(),
    score: 0,
  };
}

function createInitialState(rpsInterval: RPSChangeInterval, winScore: WinScore): GameState {
  return {
    player: getInitialPlayer('player'),
    ai: getInitialPlayer('ai'),
    status: 'playing',
    timer: ROUND_TIME,
    round: 1,
    winner: undefined,
    rpsChangeTimer: rpsInterval,
    winScore,
  };
}

export function useGameState(rpsInterval: RPSChangeInterval = 10, winScore: WinScore = 7) {
  const [state, setState] = useState<GameState>(() => createInitialState(rpsInterval, winScore));
  const timerRef = useRef<number | null>(null);

  // RPS變換倒計時
  useEffect(() => {
    if (state.status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = window.setInterval(() => {
      setState(prev => {
        if (prev.status !== 'playing') return prev;
        if (prev.rpsChangeTimer > 1) {
          return { ...prev, rpsChangeTimer: prev.rpsChangeTimer - 1 };
        } else {
          // RPS變換時間到，重新分配
          const newPlayerRPS = getRandomRPS();
          const newAIRPS = getRandomRPS();
          const player = { ...prev.player, rps: newPlayerRPS };
          const ai = { ...prev.ai, rps: newAIRPS };
          
          // 重置RPS變換計時器
          return {
            ...prev,
            player,
            ai,
            rpsChangeTimer: rpsInterval,
            round: prev.round + 1,
          };
        }
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, rpsInterval]);

  // 碰撞判斷與勝負結束
  useEffect(() => {
    if (state.status !== 'playing') return;
    if (isCollide(state.player, state.ai)) {
      if (isRPSWin(state.player.rps, state.ai.rps)) {
        setState(prev => {
          const newPlayerScore = prev.player.score + 1;
          const isGameEnd = newPlayerScore >= prev.winScore;
          return { 
            ...prev, 
            status: isGameEnd ? 'ended' : 'playing',
            winner: isGameEnd ? 'player' : undefined,
            player: { ...prev.player, score: newPlayerScore },
            // 如果遊戲沒結束，重新分配RPS和位置
            ...(isGameEnd ? {} : {
              player: { ...getInitialPlayer('player'), score: newPlayerScore },
              ai: { ...getInitialPlayer('ai'), score: prev.ai.score },
              rpsChangeTimer: rpsInterval,
            })
          };
        });
      } else if (isRPSWin(state.ai.rps, state.player.rps)) {
        setState(prev => {
          const newAiScore = prev.ai.score + 1;
          const isGameEnd = newAiScore >= prev.winScore;
          return { 
            ...prev, 
            status: isGameEnd ? 'ended' : 'playing',
            winner: isGameEnd ? 'ai' : undefined,
            ai: { ...prev.ai, score: newAiScore },
            // 如果遊戲沒結束，重新分配RPS和位置
            ...(isGameEnd ? {} : {
              player: { ...getInitialPlayer('player'), score: prev.player.score },
              ai: { ...getInitialPlayer('ai'), score: newAiScore },
              rpsChangeTimer: rpsInterval,
            })
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          // 平手時重新開始回合，但不加分
          player: { ...getInitialPlayer('player'), score: prev.player.score },
          ai: { ...getInitialPlayer('ai'), score: prev.ai.score },
          rpsChangeTimer: rpsInterval,
        }));
      }
    }
  }, [state.player, state.ai, state.status, rpsInterval]);

  // 暫停/重啟
  const pause = useCallback(() => setState(s => ({ ...s, status: 'paused' })), []);
  const resume = useCallback(() => setState(s => ({ ...s, status: 'playing' })), []);
  const restart = useCallback(() => {
    setState(createInitialState(rpsInterval, winScore));
  }, [rpsInterval, winScore]);

  return { state, setState, timerRef, pause, resume, restart };
} 