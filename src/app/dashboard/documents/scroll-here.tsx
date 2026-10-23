"use client";

import { useEffect, useRef } from "react";

// Scrolls the page to the request the student's email or WhatsApp link pointed at.
export function ScrollHere() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current?.parentElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return <span ref={ref} hidden />;
}
