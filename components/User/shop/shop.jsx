"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ArrowLeftIcon } from "@/components/icons";
import {
  SHOP_CATEGORIES,
  categoryStartingPrice,
  formatUsd,
} from "@/lib/shop/catalog";
import { ProceedOrderModal, BuyItemModal } from "./order-modals";

const stroke = {
  stroke: "black",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const CATEGORY_ICONS = {
  assets: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2L2 7L12 12L22 7L12 2Z" {...stroke} />
      <path d="M2 17L12 22L22 17" {...stroke} />
      <path d="M2 12L12 17L22 12" {...stroke} />
    </svg>
  ),
  structures: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" {...stroke} />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" {...stroke} />
      <line x1="12" y1="22.08" x2="12" y2="12" {...stroke} />
    </svg>
  ),
  feedback: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" {...stroke} />
    </svg>
  ),
  engagement: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" {...stroke} />
      <rect x="3" y="4" width="18" height="12" rx="2" {...stroke} />
      <circle cx="12" cy="10" r="2" {...stroke} />
      <line x1="8" y1="20" x2="16" y2="20" {...stroke} />
    </svg>
  ),
  trustpilot: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...stroke} />
      <path d="M12 7l1.17 2.37L15.79 9.8l-1.89 1.84.45 2.61-2.35-1.23-2.35 1.23.45-2.61-1.89-1.84 2.62-.43L12 7z" {...stroke} />
    </svg>
  ),
  tools: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" {...stroke} />
      <line x1="8" y1="21" x2="16" y2="21" {...stroke} />
      <line x1="12" y1="17" x2="12" y2="21" {...stroke} />
      <circle cx="12" cy="10" r="3" {...stroke} />
    </svg>
  ),
};

function CategoryIcon({ iconKey }) {
  return (
    <div className="w-12 h-12 bg-[#C5A964] rounded-xl flex items-center justify-center shrink-0">
      {CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.assets}
    </div>
  );
}

function CategoryCard({ category, onOpen }) {
  const from = categoryStartingPrice(category);
  return (
    <div className="bg-tertiary border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col h-full space-y-5">
      <CategoryIcon iconKey={category.iconKey} />
      <div className="flex-1 space-y-3">
        <h3 className="text-xl font-semibold text-white">{category.title}</h3>
        <p className="text-[14px] text-quaternary leading-relaxed line-clamp-4">
          {category.description}
        </p>
        <p className="text-[13px] text-white/80">
          {category.products.length} product{category.products.length === 1 ? "" : "s"}
          {from != null ? (
            <>
              {" · from "}
              <span className="text-[#C5A964] font-semibold">{formatUsd(from)}</span>
            </>
          ) : null}
        </p>
        {/* TODO: point back to /user/help once the service PDFs are published. */}
        <Link
          href="/user/chat"
          className="block text-[14px] text-[#C5A964] font-medium hover:underline w-fit"
        >
          Know more about it
        </Link>
      </div>
      <div className="pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-2 text-[#C5A964] text-[15px] font-medium hover:opacity-80 transition-opacity cursor-pointer"
        >
          View products & prices <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ProductRow({ product, onOrder }) {
  return (
    <div className="bg-tertiary border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-[16px] font-semibold text-white">{product.name}</h3>
        {product.description ? (
          <p className="text-[13px] text-quaternary leading-relaxed">{product.description}</p>
        ) : null}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
        <span className="text-[20px] font-bold text-white">
          {formatUsd(product.priceUsd)}
          <span className="text-[12px] font-medium text-quaternary ml-1">USD</span>
        </span>
        <button
          type="button"
          onClick={onOrder}
          className="h-[44px] px-5 rounded-xl bg-[#CBAF69] text-[#11191F] hover:bg-[#D4BB7D] transition-all text-[14px] font-bold"
        >
          Order
        </button>
      </div>
    </div>
  );
}

export default function UserShop() {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  /** @type {[{ product: any, category: any } | null, Function]} */
  const [selection, setSelection] = useState(null);
  const [step, setStep] = useState(/** @type {'proceed' | 'buy' | null} */ (null));

  const activeCategory = SHOP_CATEGORIES.find((c) => c.id === activeCategoryId) || null;

  const openOrder = (product, category) => {
    setSelection({ product, category });
    setStep("proceed");
  };
  const closeOrder = () => {
    setStep(null);
    setSelection(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Shop</h1>
          <p className="text-[14px] text-quaternary mt-2">
            Premium add-ons for your brand. All prices in USD.
          </p>
        </div>
        <Link
          href="/user/orders"
          className="text-[14px] text-[#C5A964] font-medium hover:underline"
        >
          Manage my orders →
        </Link>
      </div>

      {activeCategory ? (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            className="flex items-center gap-2 text-[14px] text-quaternary hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> All categories
          </button>
          <div className="flex items-start gap-4">
            <CategoryIcon iconKey={activeCategory.iconKey} />
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-white">{activeCategory.title}</h2>
              <p className="text-[14px] text-quaternary leading-relaxed mt-1">
                {activeCategory.description}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {activeCategory.products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onOrder={() => openOrder(product, activeCategory)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOP_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onOpen={() => setActiveCategoryId(category.id)}
            />
          ))}
        </div>
      )}

      <ProceedOrderModal
        isOpen={step === "proceed"}
        onClose={closeOrder}
        product={selection?.product}
        category={selection?.category}
        onProceed={() => setStep("buy")}
      />
      <BuyItemModal
        isOpen={step === "buy"}
        onClose={closeOrder}
        product={selection?.product}
        category={selection?.category}
        onOrdered={() => {
          closeOrder();
          router.push("/user/orders");
        }}
      />
    </div>
  );
}
