"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.protocol === "https:" || window.location.hostname === "localhost"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (reg) => {
            console.log("[SW] Registered scope:", reg.scope);
          },
          (err) => {
            console.error("[SW] Registration failed:", err);
          }
        );
      });
    }
  }, []);

  return null;
}
