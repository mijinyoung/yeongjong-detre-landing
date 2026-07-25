"use client";

import { useEffect } from "react";

export default function UtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_campaign", "utm_content"].forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(key, value);
    });
  }, []);
  return null;
}
