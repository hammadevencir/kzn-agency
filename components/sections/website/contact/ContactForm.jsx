"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactForm = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-50px 0px", amount: 0.2 });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
    if (!message.trim()) e.message = "Tell us a bit about what you need.";
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
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
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

  if (submitted) {
    return (
      <section
        ref={ref}
        className="flex flex-col w-full items-center justify-center py-24 px-4 gradient-bg"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4 text-center max-w-xl"
        >
          <h2 className="text-2xl md:text-4xl font-bold font-syne text-white">
            Message <span className="text-primary">sent!</span>
          </h2>
          <p className="text-[#B0B0B0] text-sm md:text-base">
            Thanks for reaching out. Our team will get back to you as soon as
            possible.
          </p>
          <Button className="mt-4" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </motion.div>
      </section>
    );
  }

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
        <div>
          <label className="block text-quaternary text-[12px] mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            placeholder="Your name"
            className={`w-full h-[52px] bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.name ? "ring-1 ring-red-500" : ""}`}
          />
          {errors.name ? (
            <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-quaternary text-[12px] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="you@example.com"
            className={`w-full h-[52px] bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none ${errors.email ? "ring-1 ring-red-500" : ""}`}
          />
          {errors.email ? (
            <p className="text-red-400 text-[11px] mt-1.5 ml-1">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label className="block text-quaternary text-[12px] mb-2">
            Phone <span className="text-quaternary/60">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 890"
            className="w-full h-[52px] bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 border-0 focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-quaternary text-[12px] mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrors((p) => ({ ...p, message: undefined }));
            }}
            rows={5}
            placeholder="How can we help?"
            className={`w-full bg-secondary text-[13px] text-white placeholder:text-quaternary/80 rounded-xl px-4 py-3 border-0 focus:ring-1 focus:ring-primary focus:outline-none resize-y min-h-[140px] ${errors.message ? "ring-1 ring-red-500" : ""}`}
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
    </section>
  );
};

export default ContactForm;
