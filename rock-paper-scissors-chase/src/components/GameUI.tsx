import React from 'react';

interface GameUIProps {
  timer: number;
  round: number;
  status: 'playing' | 'paused' | 'ended';
  winner?: 'player' | 'ai' | 'draw';
  onPause: () => void;
  onRestart: () => void;
  rpsChangeTimer: number;
  winScore: number;
}

export const GameUI: React.FC<GameUIProps> = ({ round, status, winner, onPause, onRestart, rpsChangeTimer, winScore }) => {
  return (
    <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div>回合：{round}</div>
        <div style={{ color: '#E74C3C', fontWeight: 'bold' }}>
          RPS變換倒計時：{rpsChangeTimer} 秒
        </div>
        <div>目標分數：{winScore} 分</div>
      </div>
      {status === 'ended' && (
        <div style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: '20px', padding: '8px 16px', background: '#f8f8f8', borderRadius: 8 }}>
          {winner === 'player' ? '🎉 玩家獲勝！' : winner === 'ai' ? '🤖 AI獲勝！' : '🤝 平手'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onPause} disabled={status !== 'playing'}>暫停</button>
        <button onClick={onRestart}>重啟</button>
      </div>
    </div>
  );
}; 