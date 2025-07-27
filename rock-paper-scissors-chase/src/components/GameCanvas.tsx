import React, { useRef, useEffect } from 'react';
import type { Player } from '../types/game';
import { ARENA_WIDTH, ARENA_HEIGHT, getRPSEmoji } from '../utils/constants';

interface GameCanvasProps {
  player: Player;
  ai: Player;
}

const colorMap = {
  rock: '#3498DB',
  paper: '#27AE60',
  scissors: '#E74C3C',
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ player, ai }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    // 畫賽場邊框
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    // 畫玩家
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
    ctx.fillStyle = colorMap[player.rps];
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#222';
    ctx.stroke();
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText('玩家', player.x - 20, player.y - player.radius - 10);
    // 顯示emoji圖像，占滿整個圓圈
    const emojiSize = Math.min(player.radius * 1.4, 44);
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getRPSEmoji(player.rps), player.x, player.y);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    // 畫AI
    ctx.beginPath();
    ctx.arc(ai.x, ai.y, ai.radius, 0, 2 * Math.PI);
    ctx.fillStyle = colorMap[ai.rps];
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#222';
    ctx.stroke();
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#222';
    ctx.fillText('AI', ai.x - 10, ai.y - ai.radius - 10);
    // 顯示emoji圖像，占滿整個圓圈
    const aiEmojiSize = Math.min(ai.radius * 1.4, 44);
    ctx.font = `${aiEmojiSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getRPSEmoji(ai.rps), ai.x, ai.y);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }, [player, ai]);

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        style={{ maxWidth: '100%', background: '#f8f8f8', borderRadius: 8 }}
      />
    </div>
  );
}; 