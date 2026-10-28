"use client";
import { useEffect, useRef, useState } from "react";
type Detector = {
  detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
export default function Scanner({
  onCode,
}: {
  onCode: (code: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function start() {
      try {
        const Constructor = (
          window as unknown as {
            BarcodeDetector?: new (options: { formats: string[] }) => Detector;
          }
        ).BarcodeDetector;
        if (!Constructor)
          throw new Error(
            "QR scanning is unavailable in this browser. Use manual code entry below.",
          );
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const detector = new Constructor({ formats: ["qr_code"] });
        async function scan() {
          if (stopped || !video.current) return;
          try {
            const codes = await detector.detect(video.current);
            if (codes[0]) {
              onCode(codes[0].rawValue);
              setOpen(false);
              return;
            }
          } catch {}
          if (!stopped) timer = setTimeout(scan, 350);
        }
        await scan();
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Camera unavailable. Enter the code manually.",
        );
        setOpen(false);
      }
    }
    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onCode]);
  return (
    <div>
      <button
        type="button"
        className="tt-secondary"
        onClick={() => {
          setError("");
          setOpen((v) => !v);
        }}
      >
        {open ? "Stop camera" : "Scan membership QR"}
      </button>
      {open && (
        <video
          ref={video}
          muted
          playsInline
          style={{
            width: "100%",
            maxHeight: 240,
            borderRadius: 8,
            marginTop: 12,
          }}
        />
      )}
      {error && (
        <p className="tt-fine" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
