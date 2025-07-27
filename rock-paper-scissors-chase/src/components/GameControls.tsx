import React from 'react';

export const GameControls: React.FC = () => (
  <div style={{ margin: '12px 0', color: '#666', fontSize: 14 }}>
    <div>操作說明：</div>
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      <li>方向鍵：移動玩家圓圈</li>
      <li>暫停：點擊「暫停」按鈕</li>
      <li>重啟：點擊「重啟」按鈕</li>
    </ul>
  </div>
); 