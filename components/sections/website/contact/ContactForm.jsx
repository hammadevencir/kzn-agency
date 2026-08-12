"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import SuccessModal from "@/components/ui/success-modal";
import { Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import {
  CONTACT_REQUEST_TYPE,
  CONTACT_REQUEST_TYPE_OPTIONS,
  CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS,
  CONTACT_GENDER_OPTIONS,
} from "@/lib/contact-requests/constants";

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
  requestType: "",
  platform: "",
  message: "",
};

const Chevron = () => (
  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-quaternary">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const ContactForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px 0px", amount: 0.2 });

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((p) => ({
      ...p,
      [key]: value,
      ...(key === "requestType" && value !== CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS ? { platform: "" } : {}),
    }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const isAgencyAdAccounts = form.requestType === CONTACT_REQUEST_TYPE.AGENCY_AD_ACCOUNTS;
  const isOtherRequest = form.requestType === CONTACT_REQUEST_TYPE.OTHER;

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!form.phone.trim()) e.phone = "Number is required.";
    if (!form.country) e.country = "Country is required.";
    if (!form.gender) e.gender = "Gender is required.";
    if (!form.requestType) e.requestType = "Please select a request type.";
    if (isAgencyAdAccounts && !form.platform) e.platform = "Please select a platform.";
    if (isOtherRequest && !form.message.trim()) e.message = "Tell us a bit about what you need.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          country: form.country,
          gender: form.gender,
          discordOrTelegram: form.discordOrTelegram.trim(),
          requestType: form.requestType,
          platform: isAgencyAdAccounts ? form.platform : "",
          message: form.message.trim(),
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
    <section
      ref={ref}
      className="flex flex-col w-full items-center py-16 md:py-24 px-4 gradient-bg"
    >
      <motion.div
        className="flex flex-col items-center gap-3 text-center max-w-2xl mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl md:text-4xl font-bold font-syne text-white">
          Get in <span className="text-primary">touch</span>
        </h1>
        <p className="text-[#B0B0B0] text-sm md:text-base">
          Send us a message and we&apos;ll get back to you as soon as
          possible. Your wins are our wins.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-xl flex flex-col gap-4 bg-tertiary rounded-2xl p-6 md:p-8 border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>First name</label>
            <input
              value={form.firstName}
              onChange={setField("firstName")}
              placeholder="First name"
              className={`${inputStyle} ${errors.firstName ? "ring-1 ring-red-500" : ""}`}
            />
            {errors.firstName ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.firstName}</p>
            ) : null}
          </div>

          <div>
            <label className={labelStyle}>Last name</label>
            <input
              value={form.lastName}
              onChange={setField("lastName")}
              placeholder="Last name"
              className={`${inputStyle} ${errors.lastName ? "ring-1 ring-red-500" : ""}`}
            />
            {errors.lastName ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.lastName}</p>
            ) : null}
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
          {errors.phone ? (
            <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.phone}</p>
          ) : null}
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
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
            {errors.country ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.country}</p>
            ) : null}
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
                {CONTACT_GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
            {errors.gender ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.gender}</p>
            ) : null}
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
          <label className={labelStyle}>What is your request?</label>
          <div className="relative">
            <select
              value={form.requestType}
              onChange={setField("requestType")}
              className={`${selectStyle} ${errors.requestType ? "ring-1 ring-red-500" : ""}`}
            >
              <option value="">Select a service</option>
              {CONTACT_REQUEST_TYPE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
          {errors.requestType ? (
            <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.requestType}</p>
          ) : null}
        </div>

        {isAgencyAdAccounts ? (
          <div>
            <label className={labelStyle}>Which platform?</label>
            <div className="relative">
              <select
                value={form.platform}
                onChange={setField("platform")}
                className={`${selectStyle} ${errors.platform ? "ring-1 ring-red-500" : ""}`}
              >
                <option value="">Select a platform</option>
                {CONTACT_AD_ACCOUNT_PLATFORM_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
            {errors.platform ? (
              <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.platform}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className={labelStyle}>
            Additional details {isOtherRequest ? null : <span className="text-quaternary/60">(optional)</span>}
          </label>
          <textarea
            value={form.message}
            onChange={setField("message")}
            rows={4}
            placeholder="How can we help?"
            className={`w-full bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 py-3 border-0 focus:ring-1 focus:ring-primary focus:outline-none resize-y min-h-[110px] ${errors.message ? "ring-1 ring-red-500" : ""}`}
          />
          {errors.message ? (
            <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.message}</p>
          ) : null}
        </div>

        {submitError ? (
          <p className="text-red-400 text-[12px] text-center">{submitError}</p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="w-full h-[48px] mt-2 flex items-center justify-center gap-2"
        >
          {pending ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
          Send message
        </Button>
      </motion.form>

      <SuccessModal
        isOpen={submitted}
        onClose={() => setSubmitted(false)}
        title="Your Request Is Received"
        message="We will message you on WhatsApp in the next 24 hours."
        buttonText="Done"
        onButtonClick={() => setForm(emptyForm)}
      />
    </section>
  );
};

export default ContactForm;
