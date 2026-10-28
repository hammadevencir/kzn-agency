"use client";

import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const EMPTY = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "",
  email: "",
  phone: "",
  vatNumber: "",
};

const FIELDS = [
  { key: "name", label: "Full name or business name", autoComplete: "organization", required: true },
  { key: "addressLine1", label: "Billing address", autoComplete: "address-line1", required: true, placeholder: "Street and number" },
  { key: "addressLine2", label: "Address line 2 (optional)", autoComplete: "address-line2" },
  { key: "postalCode", label: "Postal code", autoComplete: "postal-code", required: true, half: true },
  { key: "city", label: "City", autoComplete: "address-level2", required: true, half: true },
  { key: "country", label: "Country", autoComplete: "country-name", required: true },
  { key: "email", label: "Billing email", autoComplete: "email", required: true, type: "email", half: true },
  { key: "phone", label: "Contact number", autoComplete: "tel", type: "tel", half: true },
  { key: "vatNumber", label: "VAT/GST number (if applicable)" },
];

const inputClass =
  "w-full px-4 py-3 bg-secondary rounded-lg text-white placeholder:text-quaternary placeholder:text-[12px] focus:outline-none focus:ring-1 focus:ring-quaternary transition-colors";

/** Settings card: billing details printed on invoices ("Bill to"). */
export default function BillingDetailsCard({ defaultEmail = "", defaultName = "" }) {
  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(/** @type {string[]} */ ([]));
  // Prefill from the account only once (on load), never while the user types.
  const defaultsRef = useRef({ name: defaultName, email: defaultEmail });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/billing", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const b = data?.billing && typeof data.billing === "object" ? data.billing : null;
        setForm({
          ...EMPTY,
          ...(b || defaultsRef.current),
        });
      } catch {
        if (!cancelled) setForm({ ...EMPTY, ...defaultsRef.current });
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/billing", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.error === "missing_fields" && Array.isArray(data.missing)) {
          setMissing(data.missing);
          toast.error("Please fill in the required billing fields.");
        } else if (data?.error === "invalid_email") {
          setMissing(["email"]);
          toast.error("Please enter a valid billing email.");
        } else {
          toast.error("Could not save billing details. Please try again.");
        }
        return;
      }
      setMissing([]);
      toast.success("Billing details saved. They will appear on your next invoices.");
    } catch {
      toast.error("Could not save billing details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#11191F] border border-white/5 rounded-2xl ml-5 mt-6 p-3 md:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[18px] md:text-[21px] font-bold text-white mb-2">
          Billing details
        </h2>
        <p className="text-quaternary text-[11px] md:text-[12px]">
          Shown in the &quot;Bill to&quot; section of your invoices.
        </p>
      </div>

      {!loaded ? (
        <p className="text-sm text-quaternary">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-[560px] grid grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
              <label
                htmlFor={`billing-${f.key}`}
                className="block text-quaternary text-[12px] font-medium mb-2"
              >
                {f.label}
                {f.required ? <span className="text-[#C5A964]"> *</span> : null}
              </label>
              <input
                id={`billing-${f.key}`}
                type={f.type || "text"}
                value={form[f.key]}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((prev) => ({ ...prev, [f.key]: v }));
                  setMissing((prev) => prev.filter((k) => k !== f.key));
                }}
                placeholder={f.placeholder || ""}
                autoComplete={f.autoComplete}
                className={`${inputClass} ${missing.includes(f.key) ? "ring-1 ring-red-500" : ""}`}
              />
            </div>
          ))}
          <div className="col-span-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-black rounded-2xl text-[12px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save billing details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
