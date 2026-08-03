"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CloudUploadIcon, InvoicesIcon, TrashIcon } from "@/components/icons";

function formatFileSize(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function ArticleRow({ item, onDelete, deleting }) {
  return (
    <div className="bg-[#151E25] border border-white/5 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#C5A964] rounded-lg flex items-center justify-center shrink-0">
            <InvoicesIcon className="text-black" width={20} height={20} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-[16px] font-semibold truncate">{item.title}</h3>
            <p className="text-[#8B9197] text-[13px] mt-1 line-clamp-2">{item.excerpt}</p>
            <div className="flex items-center gap-3 mt-2 text-[12px] text-[#8B9197]">
              <span>{item.createdAtLabel || "Recently"}</span>
              {item.fileName ? <span className="truncate">{item.fileName}</span> : null}
              {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.pdfUrl ? (
            <a
              href={item.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C5A964] text-[13px] font-medium hover:opacity-80 transition-opacity"
            >
              View PDF
            </a>
          ) : null}
          <button
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-white/5 text-[#8B9197] hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Delete article"
          >
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminArticlesPanel() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState(
    /** @type {Array<Record<string, unknown>>} */ ([])
  );
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setArticles(res.ok && Array.isArray(data.articles) ? data.articles : []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type !== "application/pdf") {
      toast.error("Please choose a PDF file.");
      e.target.value = "";
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Enter a title.");
      return;
    }
    if (!file) {
      toast.error("Choose a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("file", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          data?.error === "no_text_found"
            ? "Couldn't find any text in that PDF."
            : data?.error === "file_too_large"
            ? "PDF is too large (max 15MB)."
            : "Could not publish article.";
        toast.error(message);
        return;
      }
      toast.success("Article published to the Help Center.");
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch {
      toast.error("Could not publish article.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Could not delete article.");
        return;
      }
      toast.success("Article deleted.");
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Could not delete article.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 mb-20 max-w-[900px]">
      <div className="mb-10">
        <h1 className="text-[32px] font-bold text-white tracking-tight">
          Create KZN article
        </h1>
        <p className="text-[#8B9197] text-[14px] mt-2 max-w-xl">
          Upload a PDF and we&apos;ll extract its text into an article that
          shows up in the Help Center for every user.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-[#151E25] border border-white/5 rounded-2xl p-6 space-y-5 mb-10"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="article-title">
            Title
          </label>
          <input
            id="article-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="e.g. How Meta ad account bans work"
            className="w-full h-12 rounded-xl bg-[#11191F] border border-white/10 px-4 text-white text-[15px] placeholder:text-quaternary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="article-file">
            PDF file
          </label>
          <label
            htmlFor="article-file"
            className="flex items-center gap-3 h-12 rounded-xl bg-[#11191F] border border-white/10 border-dashed px-4 text-[15px] text-quaternary cursor-pointer hover:border-primary/50 transition-colors"
          >
            <CloudUploadIcon className="text-[#C5A964]" width={20} height={20} />
            <span className="truncate">{file ? file.name : "Choose a PDF to upload"}</span>
          </label>
          <input
            ref={fileInputRef}
            id="article-file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="rounded-xl h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? "Publishing…" : "Publish article"}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="text-white text-[18px] font-semibold">Published articles</h2>
        {loading ? (
          <p className="text-[#8B9197] text-sm">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="text-[#8B9197] text-sm">No articles yet.</p>
        ) : (
          articles.map((item) => (
            <ArticleRow
              key={String(item.id)}
              item={item}
              onDelete={handleDelete}
              deleting={deletingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
