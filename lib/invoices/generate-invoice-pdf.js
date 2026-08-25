"use client";

/**
 * Renders <InvoicePdfTemplate> off-screen, rasterizes it, and saves it as a
 * PDF file matching the KAZAN Solutions invoice design.
 *
 * @param {{
 *   invoiceNumber: string,
 *   issueDate: string,
 *   billToName: string,
 *   billToAddress: string,
 *   description: string,
 *   totalDisplay: string,
 *   paid: boolean,
 *   filename?: string,
 * }} data
 */
export async function downloadInvoicePdf(data) {
  const [{ default: jsPDF }, { default: html2canvas }, { createRoot }, React, { default: InvoicePdfTemplate }] =
    await Promise.all([
      import("jspdf"),
      import("html2canvas"),
      import("react-dom/client"),
      import("react"),
      import("@/components/User/invoices/invoice-pdf-template"),
    ]);

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-10000px";
  container.style.zIndex = "-1";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    await new Promise((resolve) => {
      root.render(React.createElement(InvoicePdfTemplate, data));
      // Two rAFs so the browser has painted before we read layout/images.
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const node = container.firstElementChild;
    if (!node) return;

    const images = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      images.map((img) =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      )
    );

    const width = node.offsetWidth;
    const height = node.offsetHeight;

    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#2E2A25",
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    const pdf = new jsPDF({
      orientation: height >= width ? "portrait" : "landscape",
      unit: "px",
      format: [width, height],
    });
    pdf.addImage(imgData, "JPEG", 0, 0, width, height);
    pdf.save(data.filename || `${data.invoiceNumber}.pdf`);
  } finally {
    root.unmount();
    container.remove();
  }
}
