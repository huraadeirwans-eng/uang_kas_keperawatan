import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  label?: string;
  showPageBadge?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeSetting?: number | 'auto';
  onPageSizeChange?: (size: number | 'auto') => void;
  pageSizeOptions?: (number | 'auto')[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = 'data',
  showPageBadge = false,
  showPageSizeSelector = false,
  pageSizeSetting,
  onPageSizeChange,
  pageSizeOptions = [6, 8, 10, 'auto'],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <div className="px-3 sm:px-4 py-2 bg-slate-50/90 border-t border-slate-300 flex items-center justify-between gap-2 text-xs">
      {/* Information text */}
      <div className="flex items-center gap-2 text-slate-600 font-medium">
        <span>
          Menampilkan <strong className="text-slate-900">{startItem}-{endItem}</strong> dari{' '}
          <strong className="text-slate-900">{totalItems}</strong> {label}
        </span>
        {showPageBadge && (
          <>
            <span className="text-slate-400">·</span>
            <span className="font-bold text-slate-800 bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px]">
              Halaman {currentPage} dari {totalPages}
            </span>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2.5">
        {/* Page Size Selector (Hidden if showPageSizeSelector is false) */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Baris:</span>
            <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
              {pageSizeOptions.map((opt) => (
                <button
                  key={String(opt)}
                  onClick={() => onPageSizeChange(opt)}
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] transition-colors cursor-pointer ${
                    pageSizeSetting === opt
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={opt === 'auto' ? 'Otomatis sesuaikan tinggi layar' : `${opt} baris per halaman`}
                >
                  {opt === 'auto' ? 'Auto' : opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Previous / Next & Numbers */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              const prevPage = pages[idx - 1];
              const hasGap = prevPage && p - prevPage > 1;

              return (
                <React.Fragment key={p}>
                  {hasGap && <span className="px-0.5 text-slate-400 font-bold">..</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded text-xs font-bold transition-all cursor-pointer ${
                      p === currentPage
                        ? 'bg-slate-900 text-white border border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
            title="Halaman Selanjutnya"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
