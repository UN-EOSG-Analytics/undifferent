"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function ShareButton() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const isVisible = searchParams.get("symbol1") && searchParams.get("symbol2");
  if (!isVisible) return null;

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className={`ml-auto flex items-center gap-2 rounded-md bg-un-blue px-3 py-1.5 text-sm font-medium text-white transition-all ${copied ? "cursor-default" : "hover:opacity-80"}`}
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Link Copied!
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
