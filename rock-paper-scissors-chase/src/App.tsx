import React, { useCallback, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { PlayerInfo } from './components/Player';
import { GameUI } from './components/GameUI';
import { GameControls } from './components/GameControls';
import { useGameState } from './hooks/useGameState';
import { useKeyboard } from './hooks/useKeyboard';
import { useGameLoop } from './hooks/useGameLoop';
import { aiMove } from './utils/aiPlayer';
import { ARENA_WIDTH, ARENA_HEIGHT, AI_SPEED as DEFAULT_AI_SPEED, RPS_CHANGE_INTERVALS, WIN_SCORE_OPTIONS } from './utils/constants';
import type { AIType } from './utils/aiPlayer';
import type { RPSChangeInterval, WinScore } from './utils/constants';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const AI_BEHAVIORS: { label: string; value: AIType }[] = [
  { label: '積極型', value: 'aggressive' },
  { label: '謹慎型', value: 'cautious' },
  { label: '隨機型', value: 'random' },
  { label: '進階型', value: 'advanced' },
];

const App: React.FC = () => {
  const [rpsInterval, setRpsInterval] = useState<RPSChangeInterval>(10);
  const [winScore, setWinScore] = useState<WinScore>(5);
  const { state, setState, pause, resume, restart } = useGameState(rpsInterval, winScore);
  const [aiSpeed, setAiSpeed] = useState(DEFAULT_AI_SPEED);
  const [aiType, setAIType] = useState<AIType>('aggressive');
  const [playerSpeed, setPlayerSpeed] = useState(8);

  // 玩家鍵盤移動
  const movePlayer = useCallback((dx: number, dy: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      const nx = clamp(prev.player.x + dx * playerSpeed, prev.player.radius, ARENA_WIDTH - prev.player.radius);
      const ny = clamp(prev.player.y + dy * playerSpeed, prev.player.radius, ARENA_HEIGHT - prev.player.radius);
      return { ...prev, player: { ...prev.player, x: nx, y: ny } };
    });
  }, [setState, playerSpeed]);
  useKeyboard(movePlayer);

  // AI自動移動
  useGameLoop(() => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      const { x, y } = aiMove(prev.ai, prev.player, ARENA_WIDTH, ARENA_HEIGHT, aiSpeed, aiType);
      return { ...prev, ai: { ...prev.ai, x, y } };
    });
  }, state.status === 'playing');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>剪刀石頭布追逐遊戲</h2>
      {/* 遊戲設定區域 */}
      <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>遊戲設定</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <label>RPS變換間隔：
            <select 
              value={rpsInterval} 
              onChange={e => setRpsInterval(Number(e.target.value) as RPSChangeInterval)} 
              style={{ marginLeft: 8 }}
              disabled={state.status === 'playing'}
            >
              {RPS_CHANGE_INTERVALS.map(interval => (
                <option key={interval} value={interval}>{interval}秒</option>
              ))}
            </select>
          </label>
          <label>勝利賽點：
            <select 
              value={winScore} 
              onChange={e => setWinScore(Number(e.target.value) as WinScore)} 
              style={{ marginLeft: 8 }}
              disabled={state.status === 'playing'}
            >
              {WIN_SCORE_OPTIONS.map(score => (
                <option key={score} value={score}>{score}分</option>
              ))}
            </select>
          </label>
          <label>AI速度：
            <select value={aiSpeed} onChange={e => setAiSpeed(Number(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={1}>超慢</option>
              <option value={2}>慢</option>
              <option value={4}>普通</option>
              <option value={8}>快</option>
              <option value={12}>極快</option>
            </select>
          </label>
          <label>AI行為：
            <select value={aiType} onChange={e => setAIType(e.target.value as AIType)} style={{ marginLeft: 8 }}>
              {AI_BEHAVIORS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label>玩家速度：
            <select value={playerSpeed} onChange={e => setPlayerSpeed(Number(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={4}>很慢</option>
              <option value={8}>普通</option>
              <option value={12}>快</option>
              <option value={16}>極快</option>
            </select>
          </label>
        </div>
      </div>
      <GameUI
        timer={state.timer}
        round={state.round}
        status={state.status}
        winner={state.winner}
        onPause={pause}
        onRestart={restart}
        rpsChangeTimer={state.rpsChangeTimer}
        winScore={state.winScore}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <PlayerInfo player={state.player} />
        <PlayerInfo player={state.ai} />
      </div>
      <GameCanvas player={state.player} ai={state.ai} />
      <GameControls />
      {state.status === 'paused' && (
        <div style={{ color: '#888', marginTop: 16 }}>
          <button onClick={resume}>繼續遊戲</button>
        </div>
      )}
    </div>
  );
};

export default App;
