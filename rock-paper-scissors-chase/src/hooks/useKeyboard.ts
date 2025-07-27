import { useEffect } from 'react';

export function useKeyboard(onDirection: (dx: number, dy: number) => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp') dy = -1;
      else if (e.key === 'ArrowDown') dy = 1;
      else if (e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      if (dx !== 0 || dy !== 0) onDirection(dx, dy);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDirection]);
} 