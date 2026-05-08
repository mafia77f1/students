import { useIsPremium } from "@/lib/use-premium";
import { useEffect, useState } from "react";

interface AdBannerProps {
  className?: string;
}

/**
 * Discreet A-ADS banner. Hidden for premium users.
 * Place inside content flow — never above fold or near critical CTAs.
 */
export function AdBanner({ className = "" }: AdBannerProps) {
  const isPremium = useIsPremium();
  const [canLoadAd, setCanLoadAd] = useState(false);

  useEffect(() => {
    if (isPremium) return;
    const load = () => setCanLoadAd(true);
    const idleId = "requestIdleCallback" in window
      ? window.requestIdleCallback(load, { timeout: 3000 })
      : window.setTimeout(load, 2500);

    return () => {
      if ("cancelIdleCallback" in window && typeof idleId === "number") window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId as number);
    };
  }, [isPremium]);

  if (isPremium) return null;
  return (
    <div className={`my-3 opacity-90 ${className}`}>
      <div className="text-[9px] text-muted-foreground/60 text-center mb-1">إعلان</div>
      <div className="rounded-xl overflow-hidden border border-border/40 bg-card/40">
        {canLoadAd ? (
          <iframe
            data-aa="2436859"
            src="//acceptable.a-ads.com/2436859/?size=Adaptive"
            title="ad"
            loading="lazy"
            style={{
              border: 0,
              padding: 0,
              width: "100%",
              height: 90,
              overflow: "hidden",
              display: "block",
              margin: "auto",
            }}
          />
        ) : (
          <div className="h-[90px]" />
        )}
      </div>
    </div>
  );
}
