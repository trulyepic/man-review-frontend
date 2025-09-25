import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  genres: string[];
  active?: string | null;
  onSelect: (genre: string | null) => void;
};

export default function GenreStrip({ genres, active, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const eps = 1;
    const atLeft = el.scrollLeft <= eps;
    const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - eps;
    setCanScrollLeft(!atLeft);
    setCanScrollRight(!atRight);
  };

  const scrollByX = (x: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: x, behavior: "smooth" });
    updateScrollState();
    setTimeout(updateScrollState, 160);
    setTimeout(updateScrollState, 360);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [genres]);

  // WEBTOON-style tabs: text + underline (no pills), uppercase, tracking
  const tabBase =
    "whitespace-nowrap px-3 py-2 text-sm md:text-base font-semibold uppercase tracking-wide transition-colors border-b-2 border-transparent";
  const tabActive = "text-black border-black";
  const tabIdle = "text-gray-500 hover:text-black";

  //   if (!genres || genres.length === 0) return null;

  return (
    <div className="relative border-b bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative py-4">
          {/* Scroll row */}
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-hidden pr-10 items-center"
          >
            <button
              className={`${tabBase} ${
                !active ? tabActive : tabIdle
              } flex-shrink-0`}
              onClick={() => onSelect(null)}
              title="All"
            >
              ALL
            </button>

            {(genres ?? []).map((g) => {
              const isActive = (active || "").toLowerCase() === g.toLowerCase();
              return (
                <button
                  key={g}
                  className={`${tabBase} ${
                    isActive ? tabActive : tabIdle
                  } flex-shrink-0`}
                  onClick={() => onSelect(g)}
                  // Keep natural case in tooltip for readability
                  title={g}
                >
                  {g.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Left arrow */}
          <button
            onClick={() => scrollByX(-240)}
            className={`flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 transition-opacity duration-200 z-30 ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll left"
            aria-hidden={!canScrollLeft}
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scrollByX(240)}
            className={`flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 transition-opacity duration-200 z-30 ${
              canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll right"
            aria-hidden={!canScrollRight}
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
