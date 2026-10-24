import React from "react";

/* A proper button that takes the person back to where they came from. */
export default function BackButton({ onClick, children }) {
  return (
    <button type="button" className="back-btn" onClick={onClick}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {children}
    </button>
  );
}
