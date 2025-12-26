import { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  genres: string[];
  active?: string | null;
  onSelect: (genre: string | null) => void;
};

function normalizeKey(input: string) {
  // lowercase, trim, and remove all non-alphanumeric so:
  // "SCI FI" === "SCI-FI" === "sci_fi"
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

// unify known variants to one canonical display label
// add more as needed
const CANOCICAL_LABEL_BY_KEY: Record<string, string> = {
  scifi: "Sci-Fi",
  scifiandfantasy: "Sci-Fi & Fantasy",
  shounen: "Shounen",
  shonen: "Shounen",
  seinen: "Seinen",
  martialart: "Martial Arts",
  martialarts: "Martial Arts",
};

function canonicalizeLabel(raw: string) {
  const key = normalizeKey(raw);
  return CANOCICAL_LABEL_BY_KEY[key] ?? raw.trim();
}

export default function GenreStrip({ genres, active, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Build a deduped, canonical list once per genres change
  const dedupedGenres = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const raw of genres ?? []) {
      if (!raw) continue;

      const canonical = canonicalizeLabel(raw);
      const key = normalizeKey(canonical);

      if (seen.has(key)) continue;
      seen.add(key);
      out.push(canonical);
    }

    return out;
  }, [genres]);

  const activeKey = normalizeKey(active ?? "");

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
  }, [dedupedGenres]);

  // Webtoon-style tabs
  const tabBase =
    "whitespace-nowrap px-3 py-2 text-sm md:text-base font-semibold uppercase tracking-wide transition-colors border-b-2 border-transparent";
  const tabActive = "text-black border-black";
  const tabIdle = "text-gray-500 hover:text-black";

  return (
    <div className="relative border-b bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative py-4">
          {/* Scroll row: touch-scroll on mobile, arrows on desktop */}
          <div
            ref={scrollerRef}
            className="
              flex gap-4 items-center pr-10
              overflow-x-auto sm:overflow-x-hidden
              no-scrollbar
              [touch-action:pan-x] [-webkit-overflow-scrolling:touch]
            "
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

            {/* {(genres ?? []).map((g) => {
              const isActive = (active || "").toLowerCase() === g.toLowerCase();
              return (
                <button
                  key={g}
                  className={`${tabBase} ${
                    isActive ? tabActive : tabIdle
                  } flex-shrink-0`}
                  onClick={() => onSelect(g)}
                  title={g}
                >
                  {g.toUpperCase()}
                </button>
              );
            })}
          </div> */}
            {dedupedGenres.map((label) => {
              const isActive = activeKey === normalizeKey(label);
              return (
                <button
                  key={normalizeKey(label)} // stable + dedup-safe
                  className={`${tabBase} ${
                    isActive ? tabActive : tabIdle
                  } flex-shrink-0`}
                  onClick={() => onSelect(label)} // return canonical label
                  title={label}
                >
                  {label.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Desktop-only arrows */}
          <button
            onClick={() => scrollByX(-240)}
            className={`hidden sm:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 transition-opacity duration-200 z-30 ${
              canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Scroll left"
            aria-hidden={!canScrollLeft}
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => scrollByX(240)}
            className={`hidden sm:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 transition-opacity duration-200 z-30 ${
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
