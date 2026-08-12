"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import {
  AFFILIATE_GENDER_OPTIONS,
  COMMUNITY_FOCUS_OPTIONS,
  COMMUNITY_SIZE_OPTIONS,
  PROGRAM_PLATFORM_OPTIONS,
  EXPECTED_CLIENTS_OPTIONS,
} from "@/lib/affiliate-requests/constants";

const labelStyle = "block text-quaternary text-[12px] mb-2";
const inputStyle =
  "w-full h-[52px] bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none";
const selectStyle = `${inputStyle} appearance-none cursor-pointer`;

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  country: "",
  gender: "",
  discordOrTelegram: "",
  communityFocus: "",
  communityFocusOther: "",
  communitySize: "",
  platforms: [],
  platformOther: "",
  expectedClients: "",
};

const Chevron = () => (
  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-quaternary">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const AffiliateRequestForm = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const togglePlatform = (value) => {
    setForm((p) => ({
      ...p,
      platforms: p.platforms.includes(value)
        ? p.platforms.filter((v) => v !== value)
        : [...p.platforms, value],
    }));
    setErrors((p) => ({ ...p, platforms: undefined }));
  };

  const isOtherFocus = form.communityFocus === "other";
  const isOtherPlatform = form.platforms.includes("other");

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.phone.trim()) e.phone = "Number is required.";
    if (!form.country) e.country = "Country is required.";
    if (!form.gender) e.gender = "Gender is required.";
    if (!form.communityFocus) e.communityFocus = "Please select a focus.";
    if (isOtherFocus && !form.communityFocusOther.trim()) e.communityFocusOther = "Please tell us your focus.";
    if (!form.communitySize) e.communitySize = "Please select a size.";
    if (form.platforms.length === 0) e.platforms = "Select at least one platform.";
    if (isOtherPlatform && !form.platformOther.trim()) e.platformOther = "Please tell us the platform.";
    if (!form.expectedClients) e.expectedClients = "Please select an estimate.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetAndClose = () => {
    setForm(emptyForm);
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setPending(true);
    try {
      const res = await fetch("/api/affiliate-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          country: form.country,
          gender: form.gender,
          discordOrTelegram: form.discordOrTelegram.trim(),
          communityFocus: form.communityFocus,
          communityFocusOther: isOtherFocus ? form.communityFocusOther.trim() : "",
          communitySize: form.communitySize,
          platforms: form.platforms,
          platformOther: isOtherPlatform ? form.platformOther.trim() : "",
          expectedClients: form.expectedClients,
        }),
      });
      if (!res.ok) {
        setSubmitError("Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetAndClose(); }}>
      <DialogContent className="bg-tertiary w-[min(92vw,560px)] max-h-[88vh] overflow-y-auto custom-scrollbar rounded-2xl text-white p-6 md:p-8 border border-primary/20">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6">
            <DialogHeader className="sr-only">
              <DialogTitle>Your Request Is Received</DialogTitle>
            </DialogHeader>
            <div className="w-[72px] h-[72px] rounded-full bg-[#C5A964]/20 flex items-center justify-center mb-6">
              <div className="w-[52px] h-[52px] rounded-full bg-[#C5A964]/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#C5A964] flex items-center justify-center">
                  <CheckIcon className="text-black w-5 h-5" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Your Request Is Received</h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-[320px] mx-auto mb-8">
              We will message you on WhatsApp in the next 24 hours.
            </p>
            <Button
              onClick={resetAndClose}
              className="w-[225px] bg-[#C5A964] hover:bg-[#b09650] text-black font-medium py-2 rounded-lg"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-bold font-syne text-white">
                Become an <span className="text-primary">Affiliate</span>
              </DialogTitle>
              <p className="text-quaternary text-[13px] mt-1">
                Tell us about your community and coaching, and we&apos;ll get back to you.
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>First name</label>
                  <input
                    value={form.firstName}
                    onChange={setField("firstName")}
                    placeholder="First name"
                    className={`${inputStyle} ${errors.firstName ? "ring-1 ring-red-500" : ""}`}
                  />
                  {errors.firstName ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.firstName}</p> : null}
                </div>
                <div>
                  <label className={labelStyle}>Last name</label>
                  <input
                    value={form.lastName}
                    onChange={setField("lastName")}
                    placeholder="Last name"
                    className={`${inputStyle} ${errors.lastName ? "ring-1 ring-red-500" : ""}`}
                  />
                  {errors.lastName ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.lastName}</p> : null}
                </div>
              </div>

              <div>
                <label className={labelStyle}>Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="+1 234 567 890"
                  className={`${inputStyle} ${errors.phone ? "ring-1 ring-red-500" : ""}`}
                />
                {errors.phone ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.phone}</p> : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Country</label>
                  <div className="relative">
                    <select
                      value={form.country}
                      onChange={setField("country")}
                      className={`${selectStyle} ${errors.country ? "ring-1 ring-red-500" : ""}`}
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Chevron />
                  </div>
                  {errors.country ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.country}</p> : null}
                </div>
                <div>
                  <label className={labelStyle}>Gender</label>
                  <div className="relative">
                    <select
                      value={form.gender}
                      onChange={setField("gender")}
                      className={`${selectStyle} ${errors.gender ? "ring-1 ring-red-500" : ""}`}
                    >
                      <option value="">Select gender</option>
                      {AFFILIATE_GENDER_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                    <Chevron />
                  </div>
                  {errors.gender ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.gender}</p> : null}
                </div>
              </div>

              <div>
                <label className={labelStyle}>
                  Discord or Telegram name <span className="text-quaternary/60">(optional)</span>
                </label>
                <input
                  value={form.discordOrTelegram}
                  onChange={setField("discordOrTelegram")}
                  placeholder="@username"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>What is your community &amp; coaching focused on?</label>
                <div className="relative">
                  <select
                    value={form.communityFocus}
                    onChange={setField("communityFocus")}
                    className={`${selectStyle} ${errors.communityFocus ? "ring-1 ring-red-500" : ""}`}
                  >
                    <option value="">Select a focus</option>
                    {COMMUNITY_FOCUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                {errors.communityFocus ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.communityFocus}</p> : null}
              </div>

              {isOtherFocus ? (
                <div>
                  <label className={labelStyle}>Tell us what it&apos;s focused on</label>
                  <input
                    value={form.communityFocusOther}
                    onChange={setField("communityFocusOther")}
                    placeholder="Describe your niche"
                    className={`${inputStyle} ${errors.communityFocusOther ? "ring-1 ring-red-500" : ""}`}
                  />
                  {errors.communityFocusOther ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.communityFocusOther}</p> : null}
                </div>
              ) : null}

              <div>
                <label className={labelStyle}>How big is your community &amp; coaching?</label>
                <div className="relative">
                  <select
                    value={form.communitySize}
                    onChange={setField("communitySize")}
                    className={`${selectStyle} ${errors.communitySize ? "ring-1 ring-red-500" : ""}`}
                  >
                    <option value="">Select size</option>
                    {COMMUNITY_SIZE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                {errors.communitySize ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.communitySize}</p> : null}
              </div>

              <div>
                <label className={labelStyle}>Which platform is your program based on?</label>
                <div className="flex flex-wrap gap-x-5 gap-y-2 bg-secondary rounded-xl px-4 py-3">
                  {PROGRAM_PLATFORM_OPTIONS.map((o) => (
                    <label key={o.value} className="flex items-center gap-2 text-[13px] text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.platforms.includes(o.value)}
                        onChange={() => togglePlatform(o.value)}
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
                <p className="text-quaternary/60 text-[11px] mt-1.5 ml-1">You can select more than one.</p>
                {errors.platforms ? <p className="text-red-400 text-[11px] mt-1 ml-1">{errors.platforms}</p> : null}
              </div>

              {isOtherPlatform ? (
                <div>
                  <label className={labelStyle}>Which other platform?</label>
                  <input
                    value={form.platformOther}
                    onChange={setField("platformOther")}
                    placeholder="Platform name"
                    className={`${inputStyle} ${errors.platformOther ? "ring-1 ring-red-500" : ""}`}
                  />
                  {errors.platformOther ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.platformOther}</p> : null}
                </div>
              ) : null}

              <div>
                <label className={labelStyle}>Expected clients who will be onboarded by us?</label>
                <div className="relative">
                  <select
                    value={form.expectedClients}
                    onChange={setField("expectedClients")}
                    className={`${selectStyle} ${errors.expectedClients ? "ring-1 ring-red-500" : ""}`}
                  >
                    <option value="">Select an estimate</option>
                    {EXPECTED_CLIENTS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                {errors.expectedClients ? <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.expectedClients}</p> : null}
              </div>

              {submitError ? <p className="text-red-400 text-[12px] text-center">{submitError}</p> : null}

              <Button
                type="submit"
                disabled={pending}
                className="w-full h-[48px] mt-2 flex items-center justify-center gap-2"
              >
                {pending ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
                Submit application
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateRequestForm;
