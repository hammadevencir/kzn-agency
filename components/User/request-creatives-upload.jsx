'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  CREATIVE_ACCEPT_ATTR,
  CREATIVE_MAX_FILES,
} from '@/lib/ad-accounts/request-creatives';
import {
  humanizeCreativeUploadError,
  uploadRequestCreative,
  validateCreativeFile,
} from '@/lib/user/upload-request-creative';

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   previewUrl: string,
 *   status: 'uploading' | 'done' | 'error',
 *   progress: number,
 *   meta?: import('@/lib/user/upload-request-creative').RequestCreativeMeta,
 *   error?: string,
 * }} CreativeItem
 */

/**
 * Creative image picker for ad-account request forms. Files upload immediately
 * on selection (click or drag & drop) so the request itself only carries the
 * stored file references.
 *
 * The file input is a real, visually-hidden <input type="file"> wrapped in a
 * <label>, which keeps it tappable on iOS Safari / Android.
 *
 * @param {{
 *   label: string,
 *   items: CreativeItem[],
 *   onItemsChange: (updater: (prev: CreativeItem[]) => CreativeItem[]) => void,
 *   error?: string,
 * }} props
 */
export default function RequestCreativesUpload({ label, items, onItemsChange, error }) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [pickError, setPickError] = useState('');
  const previewUrlsRef = useRef(new Set());

  // Revoke object URLs when the component unmounts.
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
      urls.clear();
    };
  }, []);

  const remaining = CREATIVE_MAX_FILES - items.length;
  const isFull = remaining <= 0;

  const patchItem = (id, patch) =>
    onItemsChange((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const startUpload = (id, file) => {
    uploadRequestCreative(file, (pct) => patchItem(id, { progress: pct }))
      .then((meta) => patchItem(id, { status: 'done', progress: 100, meta, error: undefined }))
      .catch((err) =>
        patchItem(id, { status: 'error', error: humanizeCreativeUploadError(err) })
      );
  };

  /** @param {FileList | File[] | null} fileList */
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const errors = [];
    const accepted = [];
    for (const file of files) {
      if (accepted.length >= remaining) {
        errors.push(`You can upload up to ${CREATIVE_MAX_FILES} images.`);
        break;
      }
      const msg = validateCreativeFile(file);
      if (msg) errors.push(msg);
      else accepted.push(file);
    }
    setPickError(errors.join(' '));
    if (accepted.length === 0) return;

    /** @type {CreativeItem[]} */
    const newItems = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name || 'creative',
        previewUrl,
        status: 'uploading',
        progress: 0,
      };
    });
    onItemsChange((prev) => [...prev, ...newItems]);
    newItems.forEach((it, i) => startUpload(it.id, accepted[i]));
  };

  const removeItem = (id) => {
    onItemsChange((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.previewUrl) {
        URL.revokeObjectURL(it.previewUrl);
        previewUrlsRef.current.delete(it.previewUrl);
      }
      return prev.filter((x) => x.id !== id);
    });
    setPickError('');
  };

  const shownError = pickError || error;

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="text-[14px] text-[#8B9197] mb-2 block font-medium">
        {label}
      </label>

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isFull) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (!isFull) addFiles(e.dataTransfer?.files || null);
        }}
        className={`relative w-full h-[140px] border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center gap-2 transition-colors bg-[#161D26]/30 ${
          isFull
            ? 'border-[#232A33] opacity-60 cursor-not-allowed'
            : dragOver
              ? 'border-[#CBAF69] bg-[#CBAF69]/5 cursor-pointer'
              : shownError
                ? 'border-red-500/60 cursor-pointer hover:border-[#CBAF69]/50'
                : 'border-[#232A33] cursor-pointer hover:border-[#CBAF69]/50'
        }`}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept={CREATIVE_ACCEPT_ATTR}
          disabled={isFull}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            // Allow picking the same file again after removing it.
            e.target.value = '';
          }}
        />
        <div className="w-10 h-10 border-2 border-[#CBAF69] rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V8M12 8L9 11M12 8L15 11" stroke="#CBAF69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 15V16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V15" stroke="#CBAF69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="text-center px-4">
          <p className="text-white text-[14px] font-bold">
            {isFull ? 'Maximum reached' : dragOver ? 'Drop images here' : 'Upload here'}
          </p>
          <p className="text-quaternary text-[12px]">
            Png, Jpeg, Webp · up to {CREATIVE_MAX_FILES} images, 10 MB each
          </p>
        </div>
      </label>

      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <li
              key={it.id}
              className={`relative rounded-xl overflow-hidden bg-[#161D26] border ${
                it.status === 'error' ? 'border-red-500/60' : 'border-white/5'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.previewUrl}
                alt={it.name}
                className={`w-full h-[80px] object-cover ${it.status === 'uploading' ? 'opacity-50' : ''}`}
              />
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                aria-label={`Remove ${it.name}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-[14px] leading-none flex items-center justify-center hover:bg-black"
              >
                ×
              </button>
              {it.status === 'uploading' ? (
                <div className="absolute left-0 right-0 bottom-[26px] h-1 bg-white/10">
                  <div
                    className="h-full bg-[#CBAF69] transition-all"
                    style={{ width: `${Math.max(5, it.progress)}%` }}
                  />
                </div>
              ) : null}
              <p className="px-2 py-1 text-[11px] text-white truncate" title={it.error || it.name}>
                {it.status === 'uploading'
                  ? `Uploading ${it.progress}%`
                  : it.status === 'error'
                    ? <span className="text-red-400">Failed</span>
                    : it.name}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {items.some((it) => it.status === 'error') ? (
        <p className="text-red-400 text-[11px] ml-1">
          {items.find((it) => it.status === 'error')?.error} Remove the failed image and try again.
        </p>
      ) : null}
      {shownError ? <p className="text-red-400 text-[11px] ml-1">{shownError}</p> : null}
    </div>
  );
}
