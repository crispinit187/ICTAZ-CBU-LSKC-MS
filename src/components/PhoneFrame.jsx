import React from "react";

/** Keeps phone-first screens at phone width and centred on larger screens. */
export default function PhoneFrame({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        height: "100vh",
        minHeight: 640,
        margin: "0 auto",
        background: "#050505",
      }}
    >
      {children}
    </div>
  );
}
