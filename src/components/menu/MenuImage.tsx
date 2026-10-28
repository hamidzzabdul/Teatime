"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";

type MenuImageProps = { src: string; alt: string; sizes: string };

function LoadingMenuImage({ src, alt, sizes }: MenuImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {status !== "error" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          ref={(image) => {
            // Cached images may finish before the load listener is attached.
            if (image?.complete) setStatus(image.naturalWidth > 0 ? "loaded" : "error");
          }}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className="object-contain transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
        />
      )}
      <div
        aria-hidden="true"
        data-menu-image-skeleton
        className={`menu-photo-skeleton absolute inset-0 z-10 transition-opacity duration-300 motion-reduce:transition-none ${status === "loading" ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="menu-photo-shimmer absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border border-black/5 bg-white/70" />
        </div>
      </div>
      {status === "error" && (
        <div role="img" aria-label={`${alt}: photo unavailable`} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white text-brand-gray">
          <ImageOff size={28} aria-hidden="true" className="opacity-40" />
          <span className="text-xs">Photo unavailable</span>
        </div>
      )}
      <noscript><style>{`[data-menu-image-skeleton] { display: none; }`}</style></noscript>
    </>
  );
}

export default function MenuImage(props: MenuImageProps) {
  // Reset loading state whenever an item receives a different photo.
  return <LoadingMenuImage key={props.src} {...props} />;
}
