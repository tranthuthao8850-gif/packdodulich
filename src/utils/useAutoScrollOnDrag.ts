import { useEffect, useRef } from 'react';

/**
 * Automatically scrolls the window when dragging an item or container near the top or bottom edge of the viewport.
 */
export function useAutoScrollOnDrag() {
  const isDraggingRef = useRef(false);
  const mouseYRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const EDGE_THRESHOLD = 130; // distance in px from top/bottom viewport edge
    const MAX_SPEED = 24; // max scroll pixels per frame

    const doScroll = () => {
      if (!isDraggingRef.current || mouseYRef.current === null) {
        animFrameRef.current = null;
        return;
      }

      const y = mouseYRef.current;
      const viewportHeight = window.innerHeight;

      let scrollDelta = 0;

      if (y < EDGE_THRESHOLD) {
        // Near top edge -> scroll up
        const ratio = Math.max(0, (EDGE_THRESHOLD - y) / EDGE_THRESHOLD);
        scrollDelta = -Math.max(6, ratio * MAX_SPEED);
      } else if (viewportHeight - y < EDGE_THRESHOLD) {
        // Near bottom edge -> scroll down
        const distanceToBottom = viewportHeight - y;
        const ratio = Math.max(0, (EDGE_THRESHOLD - distanceToBottom) / EDGE_THRESHOLD);
        scrollDelta = Math.max(6, ratio * MAX_SPEED);
      }

      if (scrollDelta !== 0) {
        const prevY = window.scrollY || document.documentElement.scrollTop;
        window.scrollBy(0, scrollDelta);
        const newY = window.scrollY || document.documentElement.scrollTop;
        if (newY === prevY && document.documentElement) {
          document.documentElement.scrollTop += scrollDelta;
        }
      }

      animFrameRef.current = requestAnimationFrame(doScroll);
    };

    const handleDragStart = () => {
      isDraggingRef.current = true;
    };

    const handleDragOver = (e: DragEvent) => {
      isDraggingRef.current = true;
      mouseYRef.current = e.clientY;

      if (animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(doScroll);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length > 0) {
        mouseYRef.current = e.touches[0].clientY;
        if (animFrameRef.current === null) {
          animFrameRef.current = requestAnimationFrame(doScroll);
        }
      }
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      mouseYRef.current = null;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    const handleDrop = () => {
      handleDragEnd();
    };

    // Attach to window so dragover is caught regardless of target
    window.addEventListener('dragstart', handleDragStart, { passive: true });
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', handleDragEnd, { passive: true });
    window.addEventListener('drop', handleDrop, { passive: true });
    window.addEventListener('mouseup', handleDragEnd, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd, { passive: true });

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);
}
