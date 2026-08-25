"use client";

import React from "react";
import { BANK_DETAILS_FIELDS } from "@/lib/payments/bank-details";

const GOLD = "#C5A964";
const BG = "#2E2A25";
const PANEL = "#3B362F";
const LIGHT = "#B0B0B0";
const WHITE = "#FFFFFF";

/**
 * Off-screen invoice layout captured to a canvas and embedded into a PDF.
 * Kept as plain inline styles (no Tailwind / CSS variables) so html2canvas
 * never has to resolve a color it doesn't understand (e.g. oklch()).
 *
 * @param {{
 *   invoiceNumber: string,
 *   issueDate: string,
 *   billToName: string,
 *   billToAddress: string,
 *   description: string,
 *   totalDisplay: string,
 *   paid: boolean,
 * }} props
 */
const InvoicePdfTemplate = ({
  invoiceNumber,
  issueDate,
  billToName,
  billToAddress,
  description,
  totalDisplay,
  paid,
}) => {
  return (
    <div
      style={{
        width: 800,
        fontFamily:
          "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        background: BG,
        color: WHITE,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ position: "relative", padding: "40px 48px 24px" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "58%",
            background: PANEL,
            clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)",
          }}
        />
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Kazan Solutions"
            crossOrigin="anonymous"
            style={{ height: 34, display: "block", marginBottom: 16 }}
          />
          <div
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              lineHeight: 1.6,
            }}
          >
            SUITE C, LEVEL 7, WORLD TRUST
            <br />
            TOWER, 50 STANLEY STREET,
            <br />
            CENTRAL HONG KONG CHINA
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 48,
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: 2,
            color: GOLD,
          }}
        >
          INVOICE
        </div>
      </div>

      {/* Bill to / meta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 48px 24px",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
            Bill to:
          </div>
          <div style={{ fontSize: 13, color: WHITE, marginBottom: 2 }}>
            {billToName || "—"}
          </div>
          <div style={{ fontSize: 13, color: LIGHT }}>
            {billToAddress || "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>Invoice Number: </span>
            <span style={{ color: LIGHT }}>{invoiceNumber}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>Issue Date: </span>
            <span style={{ color: LIGHT }}>{issueDate}</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{ padding: "0 48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: `1px solid ${GOLD}`,
            paddingBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 1,
            }}
          >
            DESCRIPTION
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: 1,
            }}
          >
            TOTAL
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "18px 0",
          }}
        >
          <span style={{ fontSize: 13.5 }}>{description || "—"}</span>
          <span style={{ fontSize: 13.5 }}>{totalDisplay}</span>
        </div>
      </div>

      {/* Total */}
      <div style={{ padding: "170px 48px 0" }}>
        <div
          style={{
            borderTop: `1px solid ${GOLD}`,
            paddingTop: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>Total Amount:</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{totalDisplay}</span>
        </div>
        <div style={{ textAlign: "right", marginTop: 14 }}>
          <div style={{ fontSize: 10.5, color: GOLD, lineHeight: 1.6 }}>
            KAZAN Solutions is a global brand delivering top-quality services
            and solutions.
            <br />
            For any questions about your invoices, please reach out to us.
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GOLD,
              marginTop: 8,
            }}
          >
            Thank you for your Business!
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          padding: "40px 48px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: GOLD,
              marginBottom: 10,
            }}
          >
            Bank Payment Details
          </div>
          {BANK_DETAILS_FIELDS.map((f) => (
            <div
              key={f.label}
              style={{ fontSize: 10.5, color: GOLD, lineHeight: 1.7 }}
            >
              <span style={{ fontWeight: 700 }}>{f.label}</span>{" "}
              <span>{f.value}</span>
            </div>
          ))}
        </div>

        {paid ? (
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              border: `2px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(-14deg)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                border: `1px dashed ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontStyle: "italic",
                  fontWeight: 700,
                  color: GOLD,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                }}
              >
                Paid
              </span>
            </div>
          </div>
        ) : (
          <div style={{ width: 110 }} />
        )}
      </div>
    </div>
  );
};

export default InvoicePdfTemplate;
