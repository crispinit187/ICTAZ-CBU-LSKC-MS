import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/* Reads a QR code with the phone camera. Calls onCode(text) once, when a code is read.
   Nothing is uploaded: frames are decoded on the device. */
export default function CameraScanner({ onCode }) {
  const video = useRef(null);
  const [problem, setProblem] = useState("");
  const done = useRef(false);

  useEffect(() => {
    let stream = null;
    let raf = 0;
    let last = 0;
    let alive = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = (t) => {
      if (!alive || done.current) return;
      raf = requestAnimationFrame(tick);
      if (t - last < 120) return; // about 8 looks per second
      last = t;
      const v = video.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;
      const w = 480;
      const h = Math.round((v.videoHeight / v.videoWidth) * w);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(v, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      const hit = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
      if (hit && hit.data) {
        done.current = true;
        onCode(hit.data);
      }
    };

    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setProblem(
          "This browser cannot use the camera. Type the code below, or ask a Registrar to mark you.",
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((x) => x.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play().catch(() => {});
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setProblem(
          "The camera is blocked. Allow camera access for this site in your browser settings, or ask a Registrar to mark you.",
        );
      }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((x) => x.stop());
    };
  }, [onCode]);

  return (
    <>
      <video
        ref={video}
        muted
        playsInline
        aria-label="Camera view"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {problem && (
        <div
          role="alert"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 16,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(255,176,32,0.14)",
            border: "1px solid rgba(255,176,32,0.5)",
            color: "#ffd98a",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {problem}
        </div>
      )}
    </>
  );
}
