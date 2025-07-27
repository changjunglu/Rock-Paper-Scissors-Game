import React from 'react';
import type { Player } from '../types/game';
import { getRPSEmoji, getRPSName } from '../utils/constants';

export const PlayerInfo: React.FC<{ player: Player }> = ({ player }) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12, 
      padding: '12px 16px', 
      background: player.id === 'player' ? '#e3f2fd' : '#f3e5f5', 
      borderRadius: 8, 
      border: '2px solid ' + (player.id === 'player' ? '#2196f3' : '#9c27b0') 
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
        {player.id === 'player' ? '👤 玩家' : '🤖 AI'}
      </span>
      <span style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        padding: '4px 8px',
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #ddd'
      }}>
        分數: {player.score}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '28px', lineHeight: '1' }}>{getRPSEmoji(player.rps)}</span>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{getRPSName(player.rps)}</span>
      </span>
    </div>
  );
}; 