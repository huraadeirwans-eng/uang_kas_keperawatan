import { useState, useEffect, useRef } from 'react';

/**
 * Hook to dynamically calculate the optimal number of items per page
 * based on the container's exact available height.
 * Ensures the worksheet is completely full before paginating to the next page,
 * without overflowing or causing vertical scrollbars.
 */
export function useAutoPageSize(
  estimatedRowHeight: number = 42,
  minItems: number = 6,
  headerFooterOffset: number = 40
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<number>(() => {
    // Sensible initial default based on window height
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight;
      if (vh >= 900) return 12;
      if (vh >= 750) return 9;
      return 7;
    }
    return minItems;
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const calculate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // clientHeight of the container
        const h = el.clientHeight;
        if (h <= 0) return;

        // Accurately measure live thead and tfoot rendered inside the container
        const thead = el.querySelector('thead');
        const tfoot = el.querySelector('tfoot');
        const theadH = thead ? thead.offsetHeight : 0;
        const tfootH = tfoot ? tfoot.offsetHeight : 0;

        // Use measured heights with a 4px safety buffer, or fallback to headerFooterOffset
        const effectiveOffset =
          theadH + tfootH > 0 ? theadH + tfootH + 4 : headerFooterOffset;

        const contentHeight = h - effectiveOffset;
        if (contentHeight > 0) {
          const count = Math.floor(contentHeight / estimatedRowHeight);
          // Guarantee it fits strictly in 1 page view without scrollbars
          setPageSize(Math.max(1, count));
        }
      });
    };

    calculate();

    // Use ResizeObserver for accurate dynamic updates
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        calculate();
      });
      observer.observe(el);
    }

    window.addEventListener('resize', calculate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', calculate);
    };
  }, [estimatedRowHeight, minItems, headerFooterOffset]);

  return { containerRef, pageSize };
}
