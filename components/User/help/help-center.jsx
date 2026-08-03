"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowRightIcon, HelpIcon, XIcon } from "@/components/icons";

const ArticleCard = ({ title, excerpt, createdAtLabel, onRead }) => {
  return (
    <div className="bg-tertiary border border-white/5 rounded-3xl p-8 flex flex-col h-full space-y-6">
      <div className="w-12 h-12 bg-[#C5A964] rounded-xl flex items-center justify-center shrink-0">
        <HelpIcon className="text-black" width={24} height={24} />
      </div>

      <div className="flex-1 space-y-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-[14px] text-quaternary leading-relaxed line-clamp-4">
          {excerpt}
        </p>
        {createdAtLabel ? (
          <p className="text-[14px] text-[#C5A964] font-medium pt-2">{createdAtLabel}</p>
        ) : null}
      </div>

      <div className="pt-4 border-t border-white/5">
        <button
          onClick={onRead}
          className="flex items-center gap-2 text-[#C5A964] text-[15px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
        >
          Read Article <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ArticleDetailSheet = ({ article, isOpen, onClose }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[460px] bg-[#111821] border-none p-0 flex flex-col rounded-l-[32px] overflow-hidden shadow-2xl"
      >
        {article ? (
          <>
            <SheetHeader className="p-8 pb-4 shrink-0 border-b border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#C5A964] rounded-xl flex items-center justify-center shrink-0">
                    <HelpIcon className="text-black" width={24} height={24} />
                  </div>
                  <SheetTitle className="text-[20px] font-bold text-white tracking-tight">
                    {article.title}
                  </SheetTitle>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/5 rounded-full transition-colors text-gray-400"
                  aria-label="Close"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <p className="text-[15px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                {article.body}
              </p>
            </div>

            {article.pdfUrl ? (
              <div className="p-8 pt-4 shrink-0 bg-[#111821] border-t border-white/5">
                <a
                  href={article.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[52px] flex items-center justify-center rounded-2xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[16px] font-bold shadow-xl shadow-[#CBAF69]/10"
                >
                  Download original PDF
                </a>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

const HelpCenter = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/user/articles", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setArticles(res.ok && Array.isArray(data.articles) ? data.articles : []);
        }
      } catch {
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Help Center</h1>
        <p className="text-quaternary text-[14px] mt-2">
          Guides and answers from the KZN team.
        </p>
      </div>

      {loading ? (
        <p className="text-quaternary text-sm">Loading articles…</p>
      ) : articles.length === 0 ? (
        <div className="bg-tertiary border border-white/5 rounded-3xl p-10 text-center">
          <p className="text-quaternary text-sm">
            No articles yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              title={article.title}
              excerpt={article.excerpt}
              createdAtLabel={article.createdAtLabel}
              onRead={() => setActiveArticle(article)}
            />
          ))}
        </div>
      )}

      <ArticleDetailSheet
        article={activeArticle}
        isOpen={activeArticle != null}
        onClose={() => setActiveArticle(null)}
      />
    </div>
  );
};

export default HelpCenter;
