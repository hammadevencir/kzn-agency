'use client';

import React from 'react';
import { SearchIcon } from '@/components/icons';

/**
 * Shared search input for admin/user table screens. Keep styling identical everywhere.
 *
 * @param {{
 *   value?: string,
 *   onChange?: (value: string) => void,
 *   placeholder?: string,
 *   className?: string,
 * }} props
 */
const TableSearch = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative w-full sm:w-64 shrink-0 ${className}`.trim()}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-quaternary pointer-events-none">
        <SearchIcon width={16} height={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.06] border border-white/15 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 transition-colors"
      />
    </div>
  );
};

export default TableSearch;
