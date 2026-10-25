"use client";
import { Lottie, type LottieHandle } from "lottie-react";
import animationData from "./loading-animation.json";
import { useRef, useState } from "react";

export default function LoadingSpinner({ className = "w-full max-w-[80vh] mx-auto aspect-square" }: { className?: string }) {
  const lottieRef = useRef<LottieHandle>(null);
  const [paused, setPaused] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const pausedRef = useRef(paused);

  function toggle() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) {
      lottieRef.current?.pause();
    } else {
      lottieRef.current?.play();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={paused ? "Play loading animation" : "Pause loading animation"}
      className={`cursor-default rounded focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${className}`}
    >
      <Lottie
        src={animationData as object}
        loop
        autoplay={false}
        lottieRef={lottieRef}
        subscriptions={{
          ready: () => {
            if (!pausedRef.current) lottieRef.current?.play();
          },
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </button>
  );
}
