"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, Loader2, Upload } from "lucide-react";
import { CURRENT_AD_SPEND_OPTIONS } from "./pricing-data";
import {
  PRIVATE_PRICING_ACCEPT_ATTR,
  PRIVATE_PRICING_ALLOWED_TYPES,
  PRIVATE_PRICING_HONEYPOT_FIELD,
  PRIVATE_PRICING_MAX_FILES,
  PRIVATE_PRICING_MAX_FILE_BYTES,
  PRIVATE_PRICING_MAX_TOTAL_BYTES,
  resolvePrivatePricingContentType,
} from "@/lib/private-pricing/constants";

const GENERIC_ERROR =
  "We couldn't send your application right now. Please try again, or reach us on WhatsApp or Telegram.";

/** POST multipart with upload progress (fetch has no upload progress events). */
function postWithProgress(url, body, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = xhr.response;
      if (data == null && typeof xhr.responseText === "string") {
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = {};
        }
      }
      resolve({ status: xhr.status, data: data || {} });
    };
    xhr.onerror = () => resolve({ status: 0, data: {} });
    xhr.ontimeout = () => resolve({ status: 0, data: {} });
    xhr.send(body);
  });
}

const labelStyle = "block text-quaternary text-[12px] mb-2";
const inputStyle =
  "w-full h-[52px] bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none";
const selectStyle = `${inputStyle} appearance-none cursor-pointer pr-10`;
const errorRing = "ring-1 ring-red-500";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  niche: "",
  currentSpend: "",
  expectedSpend: "",
  files: [],
  message: "",
};

const Req = () => <span className="text-primary">*</span>;

const FieldError = ({ message }) =>
  message ? (
    <p className="text-red-400 text-[11px] mt-1.5 ml-1">{message}</p>
  ) : null;

const PrivatePricingDialog = ({ isOpen, onClose }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onFiles = (e) => {
    const files = Array.from(e.target.files ?? []);
    setForm((f) => ({ ...f, files }));
    if (errors.files) setErrors((er) => ({ ...er, files: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Please enter your full name.";
    if (!form.email.trim()) e.email = "Please enter your business email.";
    else if (!EMAIL_RE.test(form.email.trim()))
      e.email = "Please enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Please enter your phone / WhatsApp.";
    if (!form.company.trim()) e.company = "Please enter your company or brand.";
    if (!form.niche.trim()) e.niche = "Please tell us your niche.";
    if (!form.currentSpend) e.currentSpend = "Please select your current spend.";
    if (!form.expectedSpend.trim())
      e.expectedSpend = "Please enter your expected monthly spend.";
    if (form.files.length === 0)
      e.files = "Please upload at least one screenshot or report.";
    else if (form.files.length > PRIVATE_PRICING_MAX_FILES)
      e.files = `Please upload at most ${PRIVATE_PRICING_MAX_FILES} files.`;
    else {
      const bad = form.files.find(
        (f) =>
          !PRIVATE_PRICING_ALLOWED_TYPES.has(
            resolvePrivatePricingContentType(f.type, f.name)
          )
      );
      const big = form.files.find((f) => f.size > PRIVATE_PRICING_MAX_FILE_BYTES);
      const total = form.files.reduce((n, f) => n + f.size, 0);
      if (bad)
        e.files = `"${bad.name}" is not a supported file. Use PNG, JPG, WEBP, PDF, CSV or XLSX.`;
      else if (big) e.files = `"${big.name}" is larger than 10 MB.`;
      else if (total > PRIVATE_PRICING_MAX_TOTAL_BYTES)
        e.files = "Your files are too large in total (max 30 MB).";
    }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (pending) return;
    const e = validate();
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length > 0) return;

    const fd = new FormData();
    for (const key of [
      "fullName",
      "email",
      "phone",
      "company",
      "website",
      "niche",
      "currentSpend",
      "expectedSpend",
      "message",
    ]) {
      fd.append(key, form[key]);
    }
    fd.append(PRIVATE_PRICING_HONEYPOT_FIELD, honeypot);
    for (const f of form.files) fd.append("files", f, f.name);

    setPending(true);
    setProgress(0);
    const { status, data } = await postWithProgress(
      "/api/private-pricing",
      fd,
      setProgress
    );
    setPending(false);

    if (status >= 200 && status < 300 && data?.ok) {
      setSubmitted(true);
      return;
    }
    const message =
      typeof data?.message === "string" && data.message ? data.message : GENERIC_ERROR;
    if (typeof data?.field === "string" && data.field in emptyForm) {
      setErrors((er) => ({ ...er, [data.field]: message }));
      document.getElementById(`pp-${data.field}`)?.focus?.();
    } else if (status === 413) {
      setErrors((er) => ({ ...er, files: "Your files are too large in total (max 30 MB)." }));
    } else {
      setFormError(message);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      onClose?.();
      // Reset after the close animation.
      setTimeout(() => {
        setSubmitted(false);
        setForm(emptyForm);
        setErrors({});
        setFormError("");
        setProgress(0);
        setHoneypot("");
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl gradient-bg border-primary/20 text-white max-h-[90vh] overflow-y-auto p-5 sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <CheckCircle2 className="size-14 text-primary" strokeWidth={1.5} />
            <DialogTitle className="text-2xl font-semibold font-syne text-primary">
              Request <span className="text-white">Received!</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-[#B0B0B0] max-w-md">
              Thank you. Our team will review your information and get back to
              you with a customized proposal based on your volume and
              requirements.
            </DialogDescription>
            <Button
              className="h-11 px-8 text-sm mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center sm:text-center space-y-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                Legendary Package
              </span>
              <DialogTitle className="text-xl md:text-2xl text-center font-semibold font-syne leading-snug">
                Apply for <span className="text-primary">Private Pricing</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-center text-[#B0B0B0]">
                High-volume advertisers can apply for a private KAZAN agreement
                with customized pricing, infrastructure, and support based on
                their actual monthly volume.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4 mt-2"
            >
              {/* Honeypot — hidden from people, bots tend to fill it. */}
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] top-auto w-px h-px overflow-hidden"
              >
                <label htmlFor="pp-contactNickname">Nickname</label>
                <input
                  id="pp-contactNickname"
                  name={PRIVATE_PRICING_HONEYPOT_FIELD}
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pp-fullName" className={labelStyle}>
                    Full Name <Req />
                  </label>
                  <input
                    id="pp-fullName"
                    value={form.fullName}
                    onChange={setField("fullName")}
                    autoComplete="name"
                    className={`${inputStyle} ${errors.fullName ? errorRing : ""}`}
                  />
                  <FieldError message={errors.fullName} />
                </div>
                <div>
                  <label htmlFor="pp-email" className={labelStyle}>
                    Business Email Address <Req />
                  </label>
                  <input
                    id="pp-email"
                    type="email"
                    value={form.email}
                    onChange={setField("email")}
                    autoComplete="email"
                    className={`${inputStyle} ${errors.email ? errorRing : ""}`}
                  />
                  <FieldError message={errors.email} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pp-phone" className={labelStyle}>
                    Phone Number / WhatsApp <Req />
                  </label>
                  <input
                    id="pp-phone"
                    type="tel"
                    value={form.phone}
                    onChange={setField("phone")}
                    autoComplete="tel"
                    className={`${inputStyle} ${errors.phone ? errorRing : ""}`}
                  />
                  <FieldError message={errors.phone} />
                </div>
                <div>
                  <label htmlFor="pp-company" className={labelStyle}>
                    Company / Brand Name <Req />
                  </label>
                  <input
                    id="pp-company"
                    value={form.company}
                    onChange={setField("company")}
                    autoComplete="organization"
                    className={`${inputStyle} ${errors.company ? errorRing : ""}`}
                  />
                  <FieldError message={errors.company} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pp-website" className={labelStyle}>
                    Website{" "}
                    <span className="text-quaternary/60">(optional)</span>
                  </label>
                  <input
                    id="pp-website"
                    type="url"
                    value={form.website}
                    onChange={setField("website")}
                    placeholder="https://"
                    className={`${inputStyle} ${errors.website ? errorRing : ""}`}
                  />
                  <FieldError message={errors.website} />
                </div>
                <div>
                  <label htmlFor="pp-niche" className={labelStyle}>
                    What niche are you advertising in? <Req />
                  </label>
                  <input
                    id="pp-niche"
                    value={form.niche}
                    onChange={setField("niche")}
                    className={`${inputStyle} ${errors.niche ? errorRing : ""}`}
                  />
                  <FieldError message={errors.niche} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pp-currentSpend" className={labelStyle}>
                    Current Monthly Ad Spend <Req />
                  </label>
                  <div className="relative">
                    <select
                      id="pp-currentSpend"
                      value={form.currentSpend}
                      onChange={setField("currentSpend")}
                      className={`${selectStyle} ${errors.currentSpend ? errorRing : ""}`}
                    >
                      <option value="">Select your spend</option>
                      {CURRENT_AD_SPEND_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 size-4 text-quaternary" />
                  </div>
                  <FieldError message={errors.currentSpend} />
                </div>
                <div>
                  <label htmlFor="pp-expectedSpend" className={labelStyle}>
                    Expected Monthly Ad Spend With KAZAN <Req />
                  </label>
                  <input
                    id="pp-expectedSpend"
                    value={form.expectedSpend}
                    onChange={setField("expectedSpend")}
                    className={`${inputStyle} ${errors.expectedSpend ? errorRing : ""}`}
                  />
                  <FieldError message={errors.expectedSpend} />
                </div>
              </div>

              <div>
                <label htmlFor="pp-files" className={labelStyle}>
                  Upload Your Last 30–90 Days of Ad Spend <Req />
                </label>
                <label
                  htmlFor="pp-files"
                  className={`flex flex-col items-center justify-center gap-2 w-full min-h-[96px] bg-secondary rounded-xl px-4 py-4 border border-dashed border-primary/40 hover:border-primary cursor-pointer transition-colors text-center ${errors.files ? errorRing : ""}`}
                >
                  <Upload className="size-5 text-primary" />
                  <span className="text-[13px] text-white">
                    {form.files.length > 0
                      ? `${form.files.length} file${form.files.length > 1 ? "s" : ""} selected`
                      : "Click to choose files"}
                  </span>
                  {form.files.length > 0 ? (
                    <span className="text-[11px] text-quaternary break-all">
                      {form.files.map((f) => f.name).join(", ")}
                    </span>
                  ) : null}
                </label>
                <input
                  id="pp-files"
                  type="file"
                  multiple
                  accept={PRIVATE_PRICING_ACCEPT_ATTR}
                  disabled={pending}
                  onChange={onFiles}
                  className="sr-only"
                />
                <p className="text-quaternary/80 text-[11px] mt-1.5 ml-1">
                  Upload screenshots or reports showing your recent advertising
                  volume. Up to {PRIVATE_PRICING_MAX_FILES} files (PNG, JPG,
                  WEBP, PDF, CSV, XLSX), 10 MB each.
                </p>
                <FieldError message={errors.files} />
              </div>

              <div>
                <label htmlFor="pp-message" className={labelStyle}>
                  What are you looking for from KAZAN?
                </label>
                <textarea
                  id="pp-message"
                  value={form.message}
                  onChange={setField("message")}
                  rows={4}
                  maxLength={3000}
                  className="w-full bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 py-3 border-0 focus:ring-1 focus:ring-primary focus:outline-none resize-y min-h-[110px]"
                />
                <p className="text-quaternary/80 text-[11px] mt-1.5 ml-1">
                  Tell us about your current setup, requirements, or any
                  challenges you want us to solve.
                </p>
                <FieldError message={errors.message} />
              </div>

              {formError ? (
                <p
                  role="alert"
                  className="text-red-400 text-[12px] text-center bg-red-500/10 rounded-xl px-4 py-3"
                >
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={pending}
                className="w-full h-[48px] mt-2 text-sm font-semibold whitespace-normal"
              >
                {pending ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : null}
                {pending
                  ? progress < 100
                    ? `UPLOADING FILES… ${progress}%`
                    : "SUBMITTING…"
                  : "REQUEST MY PRIVATE QUOTATION"}
              </Button>

              <div className="flex flex-col gap-2 text-center pt-1">
                <p className="text-[11px] text-quaternary leading-relaxed">
                  Your information remains confidential and is reviewed directly
                  by our team. Qualified advertisers receive a customized
                  proposal based on their volume and requirements.
                </p>
                <p className="text-xs text-primary font-medium">
                  Higher volume. Better terms. Infrastructure built around you.
                </p>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrivatePricingDialog;
