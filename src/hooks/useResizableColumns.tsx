import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface ColumnConfig {
  id: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useResizableColumns(storageKey: string, initialColumns: ColumnConfig[]) {
  // Load from localStorage or use defaults
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`table_col_widths_${storageKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify all initial columns are present
        const result: Record<string, number> = {};
        initialColumns.forEach((col) => {
          result[col.id] = typeof parsed[col.id] === 'number' ? parsed[col.id] : col.defaultWidth;
        });
        return result;
      }
    } catch (e) {
      // Ignore localStorage error
    }
    const initial: Record<string, number> = {};
    initialColumns.forEach((col) => {
      initial[col.id] = col.defaultWidth;
    });
    return initial;
  });

  const [activeResizingCol, setActiveResizingCol] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);

  // Sync to localStorage
  const saveWidths = useCallback(
    (newWidths: Record<string, number>) => {
      try {
        localStorage.setItem(`table_col_widths_${storageKey}`, JSON.stringify(newWidths));
      } catch (e) {
        // Ignore
      }
    },
    [storageKey]
  );

  const resetAllWidths = useCallback(() => {
    const defaults: Record<string, number> = {};
    initialColumns.forEach((col) => {
      defaults[col.id] = col.defaultWidth;
    });
    setWidths(defaults);
    try {
      localStorage.removeItem(`table_col_widths_${storageKey}`);
    } catch (e) {
      // Ignore
    }
  }, [initialColumns, storageKey]);

  const resetSingleColumn = useCallback(
    (colId: string) => {
      const target = initialColumns.find((c) => c.id === colId);
      if (!target) return;
      setWidths((prev) => {
        const next = { ...prev, [colId]: target.defaultWidth };
        saveWidths(next);
        return next;
      });
    },
    [initialColumns, saveWidths]
  );

  // Mouse / Touch drag handlers
  const startResize = useCallback(
    (colId: string, clientX: number) => {
      const config = initialColumns.find((c) => c.id === colId);
      const minW = config?.minWidth ?? 28;
      const maxW = config?.maxWidth ?? 900;
      const currentW = widths[colId] || config?.defaultWidth || 100;

      dragInfoRef.current = {
        colId,
        startX: clientX,
        startWidth: currentW,
        minWidth: minW,
        maxWidth: maxW,
      };

      setActiveResizingCol(colId);

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [initialColumns, widths]
  );

  const handleMouseDown = useCallback(
    (colId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startResize(colId, e.clientX);
    },
    [startResize]
  );

  const handleTouchStart = useCallback(
    (colId: string, e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        e.stopPropagation();
        startResize(colId, e.touches[0].clientX);
      }
    },
    [startResize]
  );

  useEffect(() => {
    if (!activeResizingCol) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragInfoRef.current) return;
      const { colId, startX, startWidth, minWidth, maxWidth } = dragInfoRef.current;
      const deltaX = e.clientX - startX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(startWidth + deltaX)));

      setWidths((prev) => {
        if (prev[colId] === newWidth) return prev;
        return { ...prev, [colId]: newWidth };
      });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragInfoRef.current || e.touches.length === 0) return;
      const { colId, startX, startWidth, minWidth, maxWidth } = dragInfoRef.current;
      const deltaX = e.touches[0].clientX - startX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(startWidth + deltaX)));

      setWidths((prev) => {
        if (prev[colId] === newWidth) return prev;
        return { ...prev, [colId]: newWidth };
      });
    };

    const stopResize = () => {
      setActiveResizingCol(null);
      dragInfoRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      // Persist latest state
      setWidths((latest) => {
        saveWidths(latest);
        return latest;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', stopResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopResize);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [activeResizingCol, saveWidths]);

  // Check if any column width deviates from default
  const hasCustomWidths = initialColumns.some(
    (col) => widths[col.id] !== undefined && widths[col.id] !== col.defaultWidth
  );

  const totalTableWidth = initialColumns.reduce((sum, col) => {
    return sum + (widths[col.id] || col.defaultWidth);
  }, 0);

  // Resize Handle Component to render inside each <th>
  const ResizeHandle = ({
    columnId,
    className = '',
  }: {
    columnId: string;
    className?: string;
  }) => {
    const isThisActive = activeResizingCol === columnId;

    return (
      <div
        onMouseDown={(e) => handleMouseDown(columnId, e)}
        onTouchStart={(e) => handleTouchStart(columnId, e)}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          resetSingleColumn(columnId);
        }}
        title="Tarik ke kiri/kanan untuk ubah ukuran kolom (Klik ganda untuk reset)"
        className={`absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize z-20 flex items-center justify-center select-none group touch-none ${className}`}
      >
        {/* Visual Line */}
        <div
          className={`w-[3px] h-full transition-colors rounded-full ${
            isThisActive
              ? 'bg-blue-600 shadow-md ring-2 ring-blue-300'
              : 'bg-transparent group-hover:bg-blue-500/70'
          }`}
        />
        {/* Subtle dot indicator on hover */}
        <div
          className={`absolute w-1 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
            isThisActive ? 'bg-blue-700 opacity-100' : 'bg-slate-400'
          }`}
        />
      </div>
    );
  };

  return {
    widths,
    activeResizingCol,
    handleMouseDown,
    handleTouchStart,
    resetSingleColumn,
    resetAllWidths,
    hasCustomWidths,
    totalTableWidth,
    ResizeHandle,
  };
}
