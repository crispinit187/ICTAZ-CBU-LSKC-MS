import React, { useEffect, useState } from "react";

/**
 * Shows a fixed-size design (for example the 1440 x 810 venue screen) scaled to fit
 * the window, so it looks exactly as designed on any projector or monitor.
 */
export default function FitStage({ width, height, children }) {
  const calc = () =>
    Math.min(window.innerWidth / width, window.innerHeight / height);
  const [scale, setScale] = useState(calc);

  useEffect(() => {
    const onResize = () => setScale(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [width, height]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050505",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width,
          height,
          flex: "none",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
