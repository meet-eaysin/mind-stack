"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mindstack_cookie_consent";

export function CookieConsentBanner() {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const accepted = window.localStorage.getItem(STORAGE_KEY) === "accepted";
    setVisible(!accepted);
  }, []);

  const onAccept = React.useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }, []);

  const onDismiss = React.useCallback(() => {
    setVisible(false);
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  return (
    <aside
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed right-4 bottom-4 z-50 w-[min(30rem,calc(100vw-2rem))] rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <p className="text-sm text-foreground">
        We use cookies and local usage data to improve product reliability and
        experience.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </aside>
  );
}
