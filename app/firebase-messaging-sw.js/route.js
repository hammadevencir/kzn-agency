import { NextResponse } from "next/server";
import { getPublicFirebaseConfig } from "@/lib/firebase/public-config";
import { buildMessagingServiceWorkerSource } from "@/lib/push/build-messaging-sw";

export async function GET() {
  const config = getPublicFirebaseConfig();
  if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
    return new NextResponse("// Firebase messaging is not configured", {
      status: 503,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const source = buildMessagingServiceWorkerSource(config);

  return new NextResponse(source, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
