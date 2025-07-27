import type { Player, RPS } from '../types/game';

export function isRPSWin(a: RPS, b: RPS): boolean {
  return (
    (a === 'rock' && b === 'scissors') ||
    (a === 'scissors' && b === 'paper') ||
    (a === 'paper' && b === 'rock')
  );
}

export function isCollide(p1: Player, p2: Player): boolean {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist <= p1.radius + p2.radius;
} 