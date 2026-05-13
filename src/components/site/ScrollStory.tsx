import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ShowcaseProduct } from "@/data/products";
import { StickyImageStack } from "./StickyImageStack";
import { ProgressRail } from "./ProgressRail";
import { cn } from "@/lib/utils";
import { SmoothImage } from "@/components/ui/SmoothImage";
import { EditableText } from "@/components/cms/EditableText";
import { VerticalNav } from "./VerticalNav";
import { ChapterInteractive } from "./ChapterInteractive";
import ProductViewer360 from "./ProductViewer360";
import { Maximize2, Minimize2, ArrowLeft, Play } from "lucide-react";

// Nav height offset for sticky panel
const NAV_HEIGHT = 90;

interface Props {
  product: ShowcaseProduct;
  sectionId?: "showcaseData" | string;
  firstChapterOffset?: number;
  onChapterChange?: (index: number) => void;
  chapterDataMap?: Record<string, any>;
}

export function ScrollStory({
  product,
  sectionId = "showcaseData",
  firstChapterOffset = 0,
  onChapterChange,
  chapterDataMap,
}: Props) {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const colHeight = isPresenting ? "100vh" : `calc(100vh - ${NAV_HEIGHT}px)`;

  // Listen for custom event from Navbar
  useEffect(() => {
    const handlePresentChange = (e: any) => {
      setIsPresenting(e.detail);
    };
    window.addEventListener("presentModeChange", handlePresentChange);
    return () => window.removeEventListener("presentModeChange", handlePresentChange);
  }, []);

  // Reset video state when chapter changes
  useEffect(() => {
    setIsVideoPlaying(false);
  }, [active]);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  // Notify parent whenever active chapter changes
  useEffect(() => { onChapterChange?.(active); }, [active, onChapterChange]);

  const refs = useRef<(HTMLElement | null)[]>([]);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isJumping = useRef(false);

  const jumpTo = useCallback((i: number) => {
    const el = refs.current[i];
    const col = rightColRef.current;
    if (!el || !col) return;
    col.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  }, []);

  const advanceTo = useCallback((next: number) => {
    if (isJumping.current) return;
    isJumping.current = true;
    const boundedNext = Math.max(0, Math.min(next, product.sections.length - 1));
    setActive(boundedNext);
    jumpTo(boundedNext);
    window.setTimeout(() => {
      isJumping.current = false;
    }, 700);
  }, [jumpTo, product.sections.length]);

  // Wheel interceptor
  useEffect(() => {
    const col = rightColRef.current;
    if (!col) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = event.deltaY > 0
        ? Math.min(active + 1, product.sections.length - 1)
        : Math.max(active - 1, 0);
      advanceTo(next);
    };

    col.addEventListener("wheel", onWheel, { passive: false });
    return () => col.removeEventListener("wheel", onWheel);
  }, [active, advanceTo, product.sections.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (active < product.sections.length - 1) {
          advanceTo(active + 1);
        } else {
          navigate("/products");
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (active > 0) {
          advanceTo(active - 1);
        } else {
          navigate("/");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, advanceTo, product.sections.length, navigate]);

  // IntersectionObserver for the right column
  useEffect(() => {
    const root = rightColRef.current;
    if (!root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index);
            setActive(i);
          }
        });
      },
      { root, rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [product.sections]);

  // Map specs for ProductViewer360
  const allSpecs = product.sections.flatMap(s => (s.specs || []).map(sp => ({ ...sp, group: s.title })));

  return (
    <section
      className={cn(
        "relative transition-all duration-700 ease-brand",
        isPresenting ? "fixed inset-0 z-[100] bg-white" : "w-full"
      )}
    >
      <div className={cn(
        "hidden lg:flex w-full px-8 xl:px-16",
        isPresenting ? "h-screen" : ""
      )}>
        {/* LEFT PANEL — Title + Product Viewer */}
        <aside
          className="flex-1 flex min-w-0 self-start"
          style={{ height: colHeight, position: "sticky", top: isPresenting ? 0 : NAV_HEIGHT }}
        >
          <div className="flex h-full w-full min-w-0 gap-8 xl:gap-12 2xl:gap-16">
            <div className="flex h-full min-w-0 flex-1 flex-col">
              {/* Active section header — above 3D model */}
              <div className="pt-12 pb-2 px-2">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft size={10} /> Back to category
                </button>

                {product.sections.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "transition-all duration-500 ease-brand",
                      active === i
                        ? "opacity-100 translate-y-0 block"
                        : "opacity-0 translate-y-2 hidden"
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-accent mb-1">
                      {s.number} / {s.title}
                    </p>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                      {product.name.replace("Silent DG Set powered by Escorts Kubota engine. CPCB IV+ compliant extraction from datasheet.", "Silent DG Set")}
                    </h2>
                    {s.tagline && !s.tagline.includes("extraction from datasheet") && (
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md">
                        {s.tagline}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* 3D Model / Video — Large and centered for Overview, smaller/shifted for others */}
              <div className={cn(
                "flex items-center relative transition-all duration-500 min-h-0",
                active === 0 ? "h-[750px] justify-center" : "h-[400px] justify-start pt-2"
              )}>
                <div className="w-full max-w-full h-full relative flex items-center justify-center">
                  {active === product.sections.length - 1 && product.sections[active].videoUrl ? (
                    <div className="relative w-full h-full group flex items-center justify-center">
                      <video
                        ref={videoRef}
                        src={product.sections[active].videoUrl}
                        controls={isVideoPlaying}
                        playsInline
                        className="w-full h-full object-contain mix-blend-multiply"
                        onEnded={() => setIsVideoPlaying(false)}
                      />
                      {!isVideoPlaying && (
                        <button
                          onClick={handlePlayVideo}
                          className="absolute inset-0 m-auto flex items-center justify-center w-20 h-20 bg-accent text-primary-foreground rounded-full shadow-2xl transition-transform hover:scale-110 z-10"
                        >
                          <Play size={32} className="ml-1" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <ProductViewer360 
                      specs={allSpecs} 
                      modelName={product.name.split("powered")[0].trim()} 
                      frames={[]} 
                    />
                  )}
                </div>
              </div>
            </div>

            <ProgressRail
              count={product.sections?.length || 0}
              active={active}
              labels={(product.sections || []).map((s) => s.number)}
              images={(product.sections || []).map((s) => s.image)}
              videoUrls={(product.sections || []).map((s) => s.videoUrl)}
              onJump={jumpTo}
            />
          </div>
        </aside>

        {/* RIGHT PANEL — Content column */}
        <div
          ref={rightColRef}
          className="w-[420px] shrink-0 min-w-0 overflow-y-auto ml-10 xl:ml-12"
          style={{
            height: colHeight,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {(product.sections || []).map((s, i) => {
            const isEscorts = product.engineBrand === "Escorts";
            const chapterData = chapterDataMap ? chapterDataMap[s.id] : undefined;
            const mergedData = isEscorts ? { ...(chapterData || {}), ...s } : null;
            const articlePaddingTop = i === 0 ? Math.max(firstChapterOffset, 24) : 24;

            return (
              <article
                key={s.id}
                ref={(el) => (refs.current[i] = el)}
                data-index={i}
                className="flex min-w-0 flex-col justify-start"
                style={{
                  height: colHeight,
                  paddingTop: 100,
                  paddingBottom: 40,
                }}
              >
                {/* Section Content */}
                {isEscorts && mergedData ? (
                  <ChapterInteractive
                    chapterId={s.id}
                    data={mergedData}
                    active={active === i}
                    sectionId={sectionId}
                    index={i}
                  />
                ) : (
                  <SectionContent section={s} active={active === i} index={i} sectionId={sectionId} />
                )}
              </article>
            );
          })}
        </div>
      </div>



      {/* MOBILE STACKED LAYOUT */}
      <div className="container-x lg:hidden">
        {product.sections.map((s, i) => (
          <article key={s.id} className="py-12 border-b border-border last:border-0">
            {product.engineBrand !== "Escorts" && (
              <div className="mb-6 aspect-square overflow-hidden rounded-sm bg-muted">
                <SmoothImage src={s.image} alt={s.alt} loading="eager" wrapperClassName="h-full w-full" imageClassName="h-full w-full object-cover" />
              </div>
            )}
            {product.engineBrand === "Escorts" ? (
              <ChapterInteractive chapterId={s.id} data={s as any} active={true} sectionId={sectionId} index={i} />
            ) : (
              <SectionContent section={s} active index={i} sectionId={sectionId} />
            )}
          </article>
        ))}
      </div>

      {/* Vertical Dot Nav */}
      <VerticalNav
        sections={product.sections.map(s => ({ id: s.id, label: s.title }))}
        activeIndex={active}
        onDotClick={jumpTo}
      />
    </section>
  );
}

function getSectionBadges(id: string, index: number) {
  if (index === 0) {
    return [
      { icon: "✓", text: "CPCB IV+ Compliant" },
      { icon: "⚡", text: "Silent Operation" },
      { icon: "🏭", text: "Industrial Grade" },
      { icon: "🔧", text: "Easy Maintenance" },
      { icon: "📋", text: "ISO 9001:2015" },
    ];
  }
  return [];
}

function SectionContent({ section, active, index, sectionId }: { section: any; active: boolean; index: number; sectionId: string }) {
  const badges = getSectionBadges(section.id, index);

  return (
    <div className={cn(
      "transition-all duration-700 h-full flex flex-col",
      active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-4"
    )}>
      <div className="space-y-6 flex-1">


        <p className="text-sm text-muted-foreground leading-relaxed">
          <EditableText section={sectionId as any} contentKey={`chapter_${index}_tagline`} fallback={section.tagline} as="span" />
        </p>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {badges.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/5 border border-accent/10 text-[10px] font-bold text-accent uppercase tracking-wider">
                <span className="text-xs">{b.icon}</span> {b.text}
              </span>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-1 gap-0 divide-y divide-border/50 pt-4">
          {(section.specs || []).map((spec: any, spIdx: number) => (
            <div key={spIdx} className="flex justify-between items-baseline py-3">
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                <EditableText section={sectionId as any} contentKey={`chapter_${index}_spec${spIdx}_label`} fallback={spec.label} as="span" />
              </dt>
              <dd className="text-sm font-semibold text-foreground text-right ml-4">
                <EditableText section={sectionId as any} contentKey={`chapter_${index}_spec${spIdx}_value`} fallback={spec.value} as="span" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

