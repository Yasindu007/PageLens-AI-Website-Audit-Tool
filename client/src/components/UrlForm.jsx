// client/src/components/UrlForm.jsx
import React, { useState } from "react";

export default function UrlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError("Please enter a URL.");
      return;
    }

    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          {/* Globe icon */}
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none select-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (validationError) setValidationError("");
            }}
            placeholder="https://example.com"
            disabled={isLoading}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-paper-mid rounded-xl text-ink placeholder-ink/30 font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-audit/40 focus:border-amber-audit transition-all shadow-inner disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-7 py-3.5 bg-ink text-paper rounded-xl font-body font-semibold text-sm hover:bg-ink-soft active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
        >
          {isLoading ? (
            <>
              <span className="flex gap-1">
                <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block" />
                <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block" />
                <span className="loading-dot w-1.5 h-1.5 rounded-full bg-paper-warm inline-block" />
              </span>
              Auditing…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Audit Page
            </>
          )}
        </button>
      </div>

      {validationError && (
        <p className="mt-2 text-signal-red text-xs font-medium pl-1">{validationError}</p>
      )}
    </form>
  );
}