import { useRef, useEffect } from 'react';

export function useGameLoop(callback: () => void, running: boolean) {
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (!running) return;
    function loop() {
      callback();
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [callback, running]);
} 