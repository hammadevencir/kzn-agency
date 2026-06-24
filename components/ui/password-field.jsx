'use client';

import { useState } from 'react';
import { EyeOpenIcon, EyeClosedIcon } from '@/components/icons';

const FIELD_CLASS =
  'w-full px-4 py-3 pr-11 bg-secondary rounded-lg text-white placeholder:text-quaternary placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-quaternary transition-colors';

/**
 * Password input with show/hide toggle (settings-style layout).
 * @param {Omit<import('react').InputHTMLAttributes<HTMLInputElement>, 'type'>} props
 */
export function PasswordField({ className = '', ...rest }) {
  const [visible, setVisible] = useState(false);
  const inputClass = className ? `${FIELD_CLASS} ${className}` : FIELD_CLASS;

  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={inputClass} {...rest} />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-quaternary hover:text-white p-1 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-quaternary"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </div>
  );
}
