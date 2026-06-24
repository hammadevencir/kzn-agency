'use client';

import React from 'react';
import { DropdownArrowIcon } from '@/components/icons';

function PageNav({ currentPage, totalPages, onPageChange }) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, currentPage), safeTotal);
  return (
    <div className="flex items-center gap-3 text-[12px] md:text-[14px] shrink-0">
      <button
        type="button"
        disabled={safePage <= 1}
        onClick={() => onPageChange?.(safePage - 1)}
        className="text-[#C5A964] disabled:text-quaternary disabled:cursor-not-allowed hover:opacity-90 font-medium"
      >
        Previous
      </button>
      <span className="text-quaternary tabular-nums whitespace-nowrap">
        Page {safePage} of {safeTotal}
      </span>
      <button
        type="button"
        disabled={safePage >= safeTotal}
        onClick={() => onPageChange?.(safePage + 1)}
        className="text-[#C5A964] disabled:text-quaternary disabled:cursor-not-allowed hover:opacity-90 font-medium"
      >
        Next
      </button>
    </div>
  );
}

/**
 * Shared pagination bar for admin and user apps. Keep layout identical everywhere.
 *
 * @param {{
 *   currentPage?: number,
 *   totalPages?: number,
 *   pageSize?: number,
 *   totalItems?: number,
 *   onPageSizeChange?: (size: number) => void,
 *   onPageChange?: (page: number) => void,
 *   pageSizeOptions?: number[],
 *   className?: string,
 * }} props
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageSizeChange,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
}) => {
  const startItem =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem =
    totalItems === 0
      ? 0
      : Math.min(currentPage * pageSize, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  const rangeLabel =
    totalItems === 0
      ? '0 of 0'
      : `${startItem}-${endItem} of ${totalItems}`;

  return (
    <div
      className={`flex flex-col gap-4 mt-4 pt-4 border-t border-white/10 ${className}`.trim()}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-quaternary text-sm">
          Showing {rangeLabel}
          {totalItems > 0 ? ' entries' : ''}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-quaternary text-sm whitespace-nowrap">
              Rows per page
            </span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) =>
                  onPageSizeChange?.(Number.parseInt(e.target.value, 10))
                }
                className="bg-tertiary border border-border rounded pl-2 pr-8 py-1.5 text-white text-sm min-w-[4rem] appearance-none"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <DropdownArrowIcon width={10} height={5} />
              </div>
            </div>
          </div>
          {onPageChange ? (
            <PageNav
              currentPage={currentPage}
              totalPages={safeTotalPages}
              onPageChange={onPageChange}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Pagination;
