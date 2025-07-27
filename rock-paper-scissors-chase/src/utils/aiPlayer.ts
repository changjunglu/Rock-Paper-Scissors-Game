import type { Player, RPS } from '../types/game';
import { isRPSWin } from './gameLogic';

export type AIType = 'aggressive' | 'cautious' | 'random' | 'advanced';

// 玩家移動歷史記錄
let playerMoveHistory: Array<{ x: number; y: number; timestamp: number }> = [];
let lastPlayerPos = { x: 0, y: 0 };

// 預測玩家下一步位置
function predictPlayerMovement(player: Player): { x: number; y: number } {
  // 記錄當前位置
  const now = Date.now();
  if (Math.abs(player.x - lastPlayerPos.x) > 1 || Math.abs(player.y - lastPlayerPos.y) > 1) {
    playerMoveHistory.push({ x: player.x, y: player.y, timestamp: now });
    lastPlayerPos = { x: player.x, y: player.y };
  }
  
  // 保持最近10次移動記錄
  playerMoveHistory = playerMoveHistory.slice(-10);
  
  if (playerMoveHistory.length < 2) {
    return { x: player.x, y: player.y };
  }
  
  // 計算平均移動向量
  let avgVx = 0, avgVy = 0;
  for (let i = 1; i < playerMoveHistory.length; i++) {
    const prev = playerMoveHistory[i - 1];
    const curr = playerMoveHistory[i];
    const dt = (curr.timestamp - prev.timestamp) / 16.67; // 60fps
    avgVx += (curr.x - prev.x) / dt;
    avgVy += (curr.y - prev.y) / dt;
  }
  avgVx /= (playerMoveHistory.length - 1);
  avgVy /= (playerMoveHistory.length - 1);
  
  // 預測3幀後的位置
  return {
    x: player.x + avgVx * 3,
    y: player.y + avgVy * 3
  };
}

// 動態選擇RPS
function chooseBestRPS(currentRPS: RPS, playerRPS: RPS): RPS {
  const options: RPS[] = ['rock', 'paper', 'scissors'];
  
  // 如果當前選擇能贏，30%機率保持
  if (isRPSWin(currentRPS, playerRPS) && Math.random() < 0.3) {
    return currentRPS;
  }
  
  // 分析玩家最近的選擇模式（如果能獲得更多歷史資料）
  // 這裡簡化為反制玩家當前選擇
  const counterChoice = getCounterRPS(playerRPS);
  
  // 70%機率選擇反制，30%隨機
  return Math.random() < 0.7 ? counterChoice : options[Math.floor(Math.random() * 3)];
}

function getCounterRPS(rps: RPS): RPS {
  switch (rps) {
    case 'rock': return 'paper';
    case 'paper': return 'scissors';
    case 'scissors': return 'rock';
  }
}

function getRandomDir() {
  return Math.random() > 0.5 ? 1 : -1;
}

// 通用牆角處理函數
function handleWallEscape(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number,
  originalMoveX: number,
  originalMoveY: number
): { x: number; y: number } {
  const distToWalls = {
    left: ai.x - ai.radius,
    right: arenaWidth - ai.x - ai.radius,
    top: ai.y - ai.radius,
    bottom: arenaHeight - ai.y - ai.radius
  };
  
  const minWallDist = Math.min(distToWalls.left, distToWalls.right, distToWalls.top, distToWalls.bottom);
  
  // 如果不接近牆壁，使用原始移動
  if (minWallDist > 25) {
    return { x: originalMoveX, y: originalMoveY };
  }
  
  // 接近牆壁時使用智能逃脫
  const dx = player.x - ai.x;
  const dy = player.y - ai.y;
  const playerApproachX = dx > 0 ? 1 : -1;
  const playerApproachY = dy > 0 ? 1 : -1;
  
  // 評估逃脫選項
  const escapeOptions = [
    { x: 0, y: -1, space: distToWalls.top, score: 0 },     // 上
    { x: 0, y: 1, space: distToWalls.bottom, score: 0 },   // 下
    { x: -1, y: 0, space: distToWalls.left, score: 0 },    // 左
    { x: 1, y: 0, space: distToWalls.right, score: 0 },    // 右
    { x: -1, y: -1, space: Math.min(distToWalls.left, distToWalls.top), score: 0 },     // 左上
    { x: 1, y: -1, space: Math.min(distToWalls.right, distToWalls.top), score: 0 },     // 右上
    { x: -1, y: 1, space: Math.min(distToWalls.left, distToWalls.bottom), score: 0 },   // 左下
    { x: 1, y: 1, space: Math.min(distToWalls.right, distToWalls.bottom), score: 0 }    // 右下
  ];
  
  let bestOption = { x: 0, y: 0, score: -1000 };
  
  for (const option of escapeOptions) {
    // 基礎分數：可用空間
    option.score = option.space * 2;
    
    // 遠離玩家接近方向的加分
    const awayFromPlayerX = -playerApproachX * option.x;
    const awayFromPlayerY = -playerApproachY * option.y;
    option.score += (awayFromPlayerX + awayFromPlayerY) * 30;
    
    // 檢查該方向是否會撞牆
    const futureX = ai.x + option.x * speed;
    const futureY = ai.y + option.y * speed;
    
    if (futureX < ai.radius || futureX > arenaWidth - ai.radius ||
        futureY < ai.radius || futureY > arenaHeight - ai.radius) {
      option.score -= 150; // 會撞牆的方向大幅降分
    }
    
    // 空間太小的方向降分
    if (option.space < 10) {
      option.score -= 100;
    }
    
    if (option.score > bestOption.score) {
      bestOption = option;
    }
  }
  
  // 如果找到可行方向，使用最佳方向
  if (bestOption.score > -100) {
    let moveX = bestOption.x;
    let moveY = bestOption.y;
    
    // 正規化對角線移動
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
    }
    
    return { x: moveX, y: moveY };
  } else {
    // 緊急情況：向場地中心移動
    const centerX = arenaWidth / 2;
    const centerY = arenaHeight / 2;
    const toCenterDist = Math.sqrt((centerX - ai.x) ** 2 + (centerY - ai.y) ** 2);
    return {
      x: (centerX - ai.x) / toCenterDist,
      y: (centerY - ai.y) / toCenterDist
    };
  }
}

function aggressiveStrategy(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number
) {
  const dx = player.x - ai.x;
  const dy = player.y - ai.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: ai.x, y: ai.y };
  
  const aiWin = isRPSWin(ai.rps, player.rps);
  const playerWin = isRPSWin(player.rps, ai.rps);
  let moveX = 0, moveY = 0;
  
  if (aiWin) {
    // AI有優勢時主動追擊
    moveX = dx / dist;
    moveY = dy / dist;
  } else if (playerWin) {
    // 玩家有優勢時逃跑，但保持一定攻擊性
    let baseMoveX = -dx / dist * 0.8;
    let baseMoveY = -dy / dist * 0.8;
    
    // 添加側向移動避免被困角落
    if (Math.random() < 0.3) {
      baseMoveX += getRandomDir() * 0.5;
      baseMoveY += getRandomDir() * 0.5;
      const length = Math.sqrt(baseMoveX * baseMoveX + baseMoveY * baseMoveY);
      baseMoveX /= length;
      baseMoveY /= length;
    }
    
    // 使用通用牆角處理
    const wallEscape = handleWallEscape(ai, player, arenaWidth, arenaHeight, speed, baseMoveX, baseMoveY);
    moveX = wallEscape.x;
    moveY = wallEscape.y;
  } else {
    // 平手時保持距離，不主動靠近，通過位置優勢等待機會
    const safeDist = 80;
    let baseMoveX = 0, baseMoveY = 0;
    
    if (dist < safeDist) {
      // 太近時拉開距離
      baseMoveX = -dx / dist * 0.6;
      baseMoveY = -dy / dist * 0.6;
    } else {
      // 距離適中時保持機動性，但不靠近
      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      baseMoveX = Math.cos(angle) * 0.8;
      baseMoveY = Math.sin(angle) * 0.8;
      
      // 偶爾變換方向
      if (Math.random() < 0.3) {
        baseMoveX = -baseMoveX;
        baseMoveY = -baseMoveY;
      }
    }
    
    // 使用牆角處理確保不會卡住
    const wallEscape = handleWallEscape(ai, player, arenaWidth, arenaHeight, speed, baseMoveX, baseMoveY);
    moveX = wallEscape.x;
    moveY = wallEscape.y;
  }
  
  let newX = ai.x + moveX * speed;
  let newY = ai.y + moveY * speed;
  newX = Math.max(ai.radius, Math.min(arenaWidth - ai.radius, newX));
  newY = Math.max(ai.radius, Math.min(arenaHeight - ai.radius, newY));
  return { x: newX, y: newY };
}

function cautiousStrategy(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number
) {
  const dx = player.x - ai.x;
  const dy = player.y - ai.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: ai.x, y: ai.y };
  const playerWin = isRPSWin(player.rps, ai.rps);
  const aiWin = isRPSWin(ai.rps, player.rps);
  let moveX = 0, moveY = 0;
  if (playerWin) {
    // 被剋制時優先逃離，使用改進的牆角處理
    moveX = -dx / dist;
    moveY = -dy / dist;
    
    // 檢查牆壁距離
    const distToWalls = {
      left: ai.x - ai.radius,
      right: arenaWidth - ai.x - ai.radius,
      top: ai.y - ai.radius,
      bottom: arenaHeight - ai.y - ai.radius
    };
    
    const minWallDist = Math.min(distToWalls.left, distToWalls.right, distToWalls.top, distToWalls.bottom);
    
    // 如果接近牆壁，使用智能逃脫策略
    if (minWallDist < 30) {
      // 分析玩家接近方向
      const playerApproachX = dx > 0 ? 1 : -1;
      const playerApproachY = dy > 0 ? 1 : -1;
      
      // 評估主要逃脫方向
      const escapeOptions = [
        { x: 0, y: -1, space: distToWalls.top, score: 0 },     // 上
        { x: 0, y: 1, space: distToWalls.bottom, score: 0 },   // 下
        { x: -1, y: 0, space: distToWalls.left, score: 0 },    // 左
        { x: 1, y: 0, space: distToWalls.right, score: 0 },    // 右
        { x: -1, y: -1, space: Math.min(distToWalls.left, distToWalls.top), score: 0 },     // 左上
        { x: 1, y: -1, space: Math.min(distToWalls.right, distToWalls.top), score: 0 },     // 右上
        { x: -1, y: 1, space: Math.min(distToWalls.left, distToWalls.bottom), score: 0 },   // 左下
        { x: 1, y: 1, space: Math.min(distToWalls.right, distToWalls.bottom), score: 0 }    // 右下
      ];
      
      let bestOption = { x: 0, y: 0, score: -1000 };
      
      for (const option of escapeOptions) {
        // 基礎分數：可用空間
        option.score = option.space;
        
        // 遠離玩家接近方向的加分
        const awayFromPlayerX = -playerApproachX * option.x;
        const awayFromPlayerY = -playerApproachY * option.y;
        option.score += (awayFromPlayerX + awayFromPlayerY) * 40;
        
        // 檢查該方向是否可行
        const futureX = ai.x + option.x * speed;
        const futureY = ai.y + option.y * speed;
        
        if (futureX < ai.radius || futureX > arenaWidth - ai.radius ||
            futureY < ai.radius || futureY > arenaHeight - ai.radius) {
          option.score -= 200; // 會撞牆的方向大幅降分
        }
        
        // 空間太小的方向降分
        if (option.space < 15) {
          option.score -= 100;
        }
        
        if (option.score > bestOption.score) {
          bestOption = option;
        }
      }
      
      if (bestOption.score > -150) {
        moveX = bestOption.x;
        moveY = bestOption.y;
        
        // 正規化對角線移動
        if (moveX !== 0 && moveY !== 0) {
          const len = Math.sqrt(moveX * moveX + moveY * moveY);
          moveX /= len;
          moveY /= len;
        }
      } else {
        // 緊急情況：向場地中心移動
        const centerX = arenaWidth / 2;
        const centerY = arenaHeight / 2;
        const toCenterDist = Math.sqrt((centerX - ai.x) ** 2 + (centerY - ai.y) ** 2);
        moveX = (centerX - ai.x) / toCenterDist;
        moveY = (centerY - ai.y) / toCenterDist;
      }
    }
  } else if (aiWin) {
    // 剋制玩家時追擊，但偶爾假動作
    if (Math.random() < 0.8) {
      moveX = dx / dist;
      moveY = dy / dist;
    } else {
      // 假動作：橫向或反向
      moveX = getRandomDir();
      moveY = getRandomDir();
    }
  } else {
    // 平手時保持謹慎，不隨意靠近
    if (dist < 70) {
      // 距離太近時拉開距離
      moveX = -dx / dist * 0.5;
      moveY = -dy / dist * 0.5;
    } else {
      // 距離適中時保持觀察
      moveX = getRandomDir() * 0.3;
      moveY = getRandomDir() * 0.3;
    }
  }
  let newX = ai.x + moveX * speed;
  let newY = ai.y + moveY * speed;
  newX = Math.max(ai.radius, Math.min(arenaWidth - ai.radius, newX));
  newY = Math.max(ai.radius, Math.min(arenaHeight - ai.radius, newY));
  return { x: newX, y: newY };
}

function randomStrategy(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number
) {
  // 隨機選擇追擊、逃離、橫向
  const dx = player.x - ai.x;
  const dy = player.y - ai.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: ai.x, y: ai.y };
  
  const mode = Math.floor(Math.random() * 3); // 0:追擊 1:逃離 2:橫向
  let baseMoveX = 0, baseMoveY = 0;
  
  if (mode === 0) {
    baseMoveX = dx / dist;
    baseMoveY = dy / dist;
  } else if (mode === 1) {
    baseMoveX = -dx / dist;
    baseMoveY = -dy / dist;
  } else {
    baseMoveX = getRandomDir();
    baseMoveY = getRandomDir();
    // 正規化隨機向量
    const length = Math.sqrt(baseMoveX * baseMoveX + baseMoveY * baseMoveY);
    if (length > 0) {
      baseMoveX /= length;
      baseMoveY /= length;
    }
  }
  
  // 對所有隨機移動都使用牆角處理
  const wallEscape = handleWallEscape(ai, player, arenaWidth, arenaHeight, speed, baseMoveX, baseMoveY);
  const moveX = wallEscape.x;
  const moveY = wallEscape.y;
  
  let newX = ai.x + moveX * speed;
  let newY = ai.y + moveY * speed;
  newX = Math.max(ai.radius, Math.min(arenaWidth - ai.radius, newX));
  newY = Math.max(ai.radius, Math.min(arenaHeight - ai.radius, newY));
  return { x: newX, y: newY };
}

function advancedStrategy(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number
) {
  // 進階AI策略：結合預測移動、動態距離控制、多層決策
  const predictedPos = predictPlayerMovement(player);
  const currentDx = player.x - ai.x;
  const currentDy = player.y - ai.y;
  const currentDist = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
  
  const predictedDx = predictedPos.x - ai.x;
  const predictedDy = predictedPos.y - ai.y;
  const predictedDist = Math.sqrt(predictedDx * predictedDx + predictedDy * predictedDy);
  
  if (currentDist === 0) return { x: ai.x, y: ai.y };
  
  const aiWin = isRPSWin(ai.rps, player.rps);
  const playerWin = isRPSWin(player.rps, ai.rps);
  
  let moveX = 0, moveY = 0;
  let aggressiveness = 1.0;
  
  // 根據距離調整策略
  const safeDistance = 80;
  const attackDistance = 50;
  
  if (aiWin) {
    // AI有優勢時
    if (currentDist > attackDistance) {
      // 距離較遠時追向預測位置
      moveX = predictedDx / predictedDist;
      moveY = predictedDy / predictedDist;
      aggressiveness = 1.0;
    } else {
      // 距離很近時直接攻擊
      moveX = currentDx / currentDist;
      moveY = currentDy / currentDist;
      aggressiveness = 1.2;
    }
  } else if (playerWin) {
    // 玩家有優勢時採用進階逃跑策略
    if (currentDist < safeDistance) {
      // 緊急逃離，使用欺騙性移動
      let escapeX = -currentDx / currentDist;
      let escapeY = -currentDy / currentDist;
      
      // 檢查牆角情況
      const distToWalls = {
        left: ai.x - ai.radius,
        right: arenaWidth - ai.x - ai.radius,
        top: ai.y - ai.radius,
        bottom: arenaHeight - ai.y - ai.radius
      };
      
      const minWallDist = Math.min(distToWalls.left, distToWalls.right, distToWalls.top, distToWalls.bottom);
      const isNearWall = minWallDist < 40;
      const isInCorner = (distToWalls.left < 50 || distToWalls.right < 50) && 
                        (distToWalls.top < 50 || distToWalls.bottom < 50);
      
      if (isInCorner || isNearWall) {
        // 智能角落/牆邊逃脫：分析玩家來向，選擇最佳逃脫方向
        
        // 分析玩家接近的方向（基於位置關係）
        const playerApproachX = currentDx > 0 ? 1 : -1; // 玩家在AI右側(1)或左側(-1)
        const playerApproachY = currentDy > 0 ? 1 : -1; // 玩家在AI下方(1)或上方(-1)
        
        // 評估四個主要逃脫方向的可行性
        const escapeOptions = [
          { dir: 'up', x: 0, y: -1, space: distToWalls.top, score: 0 },
          { dir: 'down', x: 0, y: 1, space: distToWalls.bottom, score: 0 },
          { dir: 'left', x: -1, y: 0, space: distToWalls.left, score: 0 },
          { dir: 'right', x: 1, y: 0, space: distToWalls.right, score: 0 }
        ];
        
        // 計算每個方向的逃脫分數
        for (const option of escapeOptions) {
          // 基礎分數：可用空間
          option.score = option.space;
          
          // 遠離玩家接近方向的加分
          const awayFromPlayerX = -playerApproachX * option.x;
          const awayFromPlayerY = -playerApproachY * option.y;
          option.score += (awayFromPlayerX + awayFromPlayerY) * 50;
          
          // 對角線逃脫的額外評估
          if (option.x !== 0 && option.y !== 0) {
            option.score *= 0.7; // 對角線移動稍微降分
          }
          
          // 如果該方向空間太小，大幅降分
          if (option.space < 20) {
            option.score -= 100;
          }
        }
        
        // 同時評估對角線方向
        const diagonalOptions = [
          { dir: 'up-left', x: -1, y: -1, space: Math.min(distToWalls.left, distToWalls.top), score: 0 },
          { dir: 'up-right', x: 1, y: -1, space: Math.min(distToWalls.right, distToWalls.top), score: 0 },
          { dir: 'down-left', x: -1, y: 1, space: Math.min(distToWalls.left, distToWalls.bottom), score: 0 },
          { dir: 'down-right', x: 1, y: 1, space: Math.min(distToWalls.right, distToWalls.bottom), score: 0 }
        ];
        
        for (const option of diagonalOptions) {
          option.score = option.space * 0.8; // 對角線基礎分稍低
          
          // 遠離玩家的額外分數
          const awayFromPlayerX = -playerApproachX * option.x;
          const awayFromPlayerY = -playerApproachY * option.y;
          option.score += (awayFromPlayerX + awayFromPlayerY) * 40;
          
          if (option.space < 25) {
            option.score -= 80;
          }
        }
        
        // 合併所有選項並選擇最佳方向
        const allOptions = [...escapeOptions, ...diagonalOptions];
        allOptions.sort((a, b) => b.score - a.score);
        
        const bestOption = allOptions[0];
        
        if (bestOption.score > -50) {
          // 使用最佳方向
          escapeX = bestOption.x;
          escapeY = bestOption.y;
          
          // 正規化對角線移動
          if (bestOption.x !== 0 && bestOption.y !== 0) {
            const len = Math.sqrt(2);
            escapeX /= len;
            escapeY /= len;
          }
        } else {
          // 所有方向都不好，強制向場地中心移動
          const centerX = arenaWidth / 2;
          const centerY = arenaHeight / 2;
          const toCenterDist = Math.sqrt((centerX - ai.x) ** 2 + (centerY - ai.y) ** 2);
          escapeX = (centerX - ai.x) / toCenterDist;
          escapeY = (centerY - ai.y) / toCenterDist;
        }
        
        aggressiveness = 1.6; // 最高逃離速度
      } else {
        // 開放空間的欺騙性逃跑
        const time = Date.now() / 100;
        
        // 基本逃離方向
        escapeX = -currentDx / currentDist;
        escapeY = -currentDy / currentDist;
        
        // 添加之字形移動
        const zigzagAngle = Math.atan2(escapeY, escapeX) + Math.sin(time * 0.1) * Math.PI / 4;
        escapeX = Math.cos(zigzagAngle);
        escapeY = Math.sin(zigzagAngle);
        
        // 偶爾加入假動作
        if (Math.random() < 0.15) {
          escapeX += (Math.random() - 0.5) * 1.2;
          escapeY += (Math.random() - 0.5) * 1.2;
        }
        
        aggressiveness = 1.3;
      }
      
      moveX = escapeX;
      moveY = escapeY;
      
      // 正規化移動向量
      const escapeLength = Math.sqrt(moveX * moveX + moveY * moveY);
      if (escapeLength > 0) {
        moveX /= escapeLength;
        moveY /= escapeLength;
      }
    } else {
      // 距離較安全時進行不規律的戰術性移動
      const time = Date.now() / 1000;
      const baseAngle = Math.atan2(currentDy, currentDx) + Math.PI / 2;
      
      // 不規律的環繞移動
      const wobbleAngle = baseAngle + Math.sin(time * 3) * Math.PI / 6;
      moveX = Math.cos(wobbleAngle) * 0.7 - (currentDx / currentDist) * 0.3;
      moveY = Math.sin(wobbleAngle) * 0.7 - (currentDy / currentDist) * 0.3;
      
      // 隨機改變方向
      if (Math.random() < 0.1) {
        moveX = -moveX;
        moveY = -moveY;
      }
      
      aggressiveness = 0.9;
    }
  } else {
    // 平手時不主動接近，保持戰略優勢位置等待機會
    const minSafeDist = 90;
    const maxSafeDist = 150;
    
    if (currentDist < minSafeDist) {
      // 太近時拉開距離到安全範圍
      moveX = -currentDx / currentDist * 0.8;
      moveY = -currentDy / currentDist * 0.8;
      aggressiveness = 1.1;
    } else if (currentDist > maxSafeDist) {
      // 太遠時稍微靠近，但不進入危險距離
      moveX = currentDx / currentDist * 0.3;
      moveY = currentDy / currentDist * 0.3;
      aggressiveness = 0.7;
    } else {
      // 在安全距離內保持機動性，尋找位置優勢
      const time = Date.now() / 1000;
      const circleAngle = Math.atan2(currentDy, currentDx) + Math.PI / 3;
      
      // 使用時間變化的圓周運動，不容易被預測
      const orbitRadius = 0.6 + Math.sin(time * 2) * 0.3;
      moveX = Math.cos(circleAngle + time * 0.8) * orbitRadius;
      moveY = Math.sin(circleAngle + time * 0.8) * orbitRadius;
      
      // 偶爾加入不規則移動
      if (Math.random() < 0.2) {
        moveX += (Math.random() - 0.5) * 0.8;
        moveY += (Math.random() - 0.5) * 0.8;
      }
      
      aggressiveness = 0.8;
    }
    
    // 正規化移動向量
    const moveLength = Math.sqrt(moveX * moveX + moveY * moveY);
    if (moveLength > 0) {
      moveX /= moveLength;
      moveY /= moveLength;
    }
  }
  
  let newX = ai.x + moveX * speed * aggressiveness;
  let newY = ai.y + moveY * speed * aggressiveness;
  newX = Math.max(ai.radius, Math.min(arenaWidth - ai.radius, newX));
  newY = Math.max(ai.radius, Math.min(arenaHeight - ai.radius, newY));
  return { x: newX, y: newY };
}

export function aiMove(
  ai: Player,
  player: Player,
  arenaWidth: number,
  arenaHeight: number,
  speed: number,
  aiType: AIType = 'aggressive'
): { x: number; y: number } {
  switch (aiType) {
    case 'aggressive':
      return aggressiveStrategy(ai, player, arenaWidth, arenaHeight, speed);
    case 'cautious':
      return cautiousStrategy(ai, player, arenaWidth, arenaHeight, speed);
    case 'advanced':
      return advancedStrategy(ai, player, arenaWidth, arenaHeight, speed);
    default:
      return randomStrategy(ai, player, arenaWidth, arenaHeight, speed);
  }
}

// 導出動態RPS選擇功能
export function getOptimalRPS(currentRPS: RPS, playerRPS: RPS): RPS {
  return chooseBestRPS(currentRPS, playerRPS);
}

// 重置玩家移動歷史（用於新遊戲開始時）
export function resetPlayerHistory(): void {
  playerMoveHistory = [];
  lastPlayerPos = { x: 0, y: 0 };
} 