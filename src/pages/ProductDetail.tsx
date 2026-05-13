import { Link, useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/site/SEO";
import { ScrollStory } from "@/components/site/ScrollStory";
import { ArrowLeft, Monitor, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { EditableText } from "@/components/cms/EditableText";
import { useCMSState } from "@/components/cms/CMSEditorProvider";
import { fetchProductShowcase } from "@/lib/api/cms";
import { fetchProductDetailV2 } from "@/lib/api/productDetailV2";
import type { V2ShowcaseProduct } from "@/lib/api/productDetailV2";
// Legacy fallback (will be removed once v2 migration is confirmed)
import { ShowcaseProduct, getProductBySlug } from "@/data/products";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
const videoThumb = "/assets/products/showcase/main-view-optimized.jpg";



// Import core showcase assets to ensure they are bundled correctly


// Height of the absolute header overlay in px — used to offset first chapter
export const SHOWCASE_HEADER_H = 230;

export default function ProductDetail() {
  const { slug, pageId } = useParams();
  const navigate = useNavigate();

  const { content, loadProductCMS } = useCMSState();
  const [activeChapter, setActiveChapter] = useState(0);
  const [product, setProduct] = useState<ShowcaseProduct | null>(null);
  const [v2Product, setV2Product] = useState<V2ShowcaseProduct | null>(null);
  const [loading, setLoading] = useState(true);


  const isCMSPreview = !!pageId?.startsWith("showcaseData") || !!pageId?.startsWith("ekl15ShowcaseData");

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      try {
        // ── V2 path: fetch from new relational tables ──
        const v2Data = await fetchProductDetailV2(slug);
        if (v2Data && v2Data.sections.length > 0) {
          console.log("✅ Using v2 product data for:", slug);
          
          // Always ensure video section exists with correct Supabase URL
          const SHOWCASE_VIDEO = "https://vbbeibweeavuksmvkbnb.supabase.co/storage/v1/object/public/product-assets/product-video.mp4";
          const VIDEO_THUMB = "/assets/products/showcase/main-view-optimized.jpg";
          const existingVideoSec = v2Data.sections.find(s => s.id === "video");
          if (!existingVideoSec) {
            v2Data.sections.push({
              id: "video",
              number: String(v2Data.sections.length + 1).padStart(2, "0"),
              title: "Product Video",
              tagline: "360° Product Showcase — Experience the engineering and build quality in detail.",
              image: VIDEO_THUMB,
              videoUrl: SHOWCASE_VIDEO,
              alt: `${v2Data.name} 360 degree showcase`,
              specs: [
                { label: "Duration", value: "8 sec" },
                { label: "Format", value: "MP4" },
                { label: "Source", value: "360° View" },
              ],
            });
          } else {
            // Always force the Supabase URL — override whatever DB returned
            existingVideoSec.videoUrl = SHOWCASE_VIDEO;
            if (!existingVideoSec.image) existingVideoSec.image = VIDEO_THUMB;
            existingVideoSec.tagline = "360° Product Showcase — Experience the engineering and build quality in detail.";
          }
          if (!v2Data.hotspots.find(h => h.id === "video")) {
            v2Data.hotspots.push({
              id: "video", x: 50, y: 50,
              title: "Product Video",
              description: `Experience the ${v2Data.name} in action with our official 360° showcase film.`,
              specs: [{ label: "Showcase", value: "360° View" }],
              zoom: 1, offsetX: 0, offsetY: 0,
            });
          }

          // Set as legacy-compatible ShowcaseProduct for ScrollStory
          setProduct(v2Data as any);
          // Fix stale kVA in chapterDataMap.overview.highlights (DB may have wrong value from template)
          if (v2Data.chapterDataMap?.overview) {
            const ov = v2Data.chapterDataMap.overview;
            // Always set kva to the actual product value
            ov.kva = String(v2Data.kva ?? "");
            // Correct the first highlight entry if it's a kVA stat
            if (Array.isArray(ov.highlights) && ov.highlights.length > 0) {
              const first = ov.highlights[0];
              if (first.suffix === "kVA" || first.label?.toLowerCase().includes("kva")) {
                ov.highlights[0] = { ...first, value: String(v2Data.kva ?? first.value) };
              }
            }
          }

          setV2Product(v2Data);
          await loadProductCMS(v2Data.id);
          setLoading(false);
          return;
        }

        // ── Legacy path: CMS + static fallback ──
        console.log("⚠️ V2 data empty, falling back to legacy for:", slug);
        const data = await fetchProductShowcase(slug);
        const staticData = getProductBySlug(slug);
        
        if (data && data.product) {
          const productMedia = (data.product as any).product_media || [];
          const primaryImage =
            productMedia.find((m: any) => m.kind === 'primary' || m.kind === 'hero')?.public_url ||
            data.showcase?.sections?.[0]?.image ||
            staticData?.thumbnail ||
            "";

          const isEscort = ((data.product as any).engine_brand || staticData?.engineBrand || "").toLowerCase().includes("escort");
          
          const getEscortFallback = (key: string, current: string) => {
            if (!isEscort) return current;
            const isPlaceholder = !current || current.includes("placeholder") || current.includes("enclosure.jpg") || current.includes("engine-real.jpg");
            if (!isPlaceholder) return current;

            const k = key.toLowerCase();
            if (k.includes("engine")) return "/assets/products/escorts/escort_40kva_2.jpg";
            if (k.includes("alternator")) return "/assets/products/escorts/escort_40kva_3.jpg";
            if (k.includes("control")) return "/assets/products/escorts/escort_30kva_1.jpg";
            if (k.includes("enclosure") || k.includes("canopy")) return "/assets/products/escorts/escort_58_5kva_5.jpg";
            if (k.includes("protection")) return "/assets/products/escorts/escort_58_5kva_6.jpg";
            if (k.includes("electrical")) return "/assets/products/escorts/escort_40kva_4.jpg";
            if (k.includes("supply")) return "/assets/products/escorts/escort_20kva_1.jpg";
            if (k.includes("dimension")) return "/assets/products/escorts/escort_20kva.jpg";
            if (k.includes("fuel")) return "/assets/products/escorts/escort_20kva_1.jpg";
            return "/assets/products/escorts/escort_15kva_2.jpg";
          };

          let finalProduct: ShowcaseProduct = {
            id: data.product.id,
            slug: data.product.slug,
            name: data.product.name,
            kva: data.product.kva,
            engineBrand: (data.product as any).engine_brand || staticData?.engineBrand,
            range: "15-62.5", 
            status: "active",
            thumbnail: primaryImage, 
            hero: primaryImage, 
            sections: (data.showcase?.sections || staticData?.sections || []).map((s: any) => ({
              ...s,
              image: getEscortFallback(s.id, s.image)
            })),
            hotspots: (data.showcase?.hotspots?.length >= 8 ? data.showcase.hotspots : (staticData?.hotspots || [])).map((h: any) => ({
              ...h,
              subImage: getEscortFallback(h.id, h.subImage)
            })),
          };

          // Ensure Electrical section exists for consistency
          if (!finalProduct.sections.find(s => s.id === "electrical")) {
            const videoIdx = finalProduct.sections.findIndex(s => s.id === "video");
            const newElectrical = {
              id: "electrical",
              number: "10",
              title: "Electrical Performance",
              tagline: "Comprehensive electrical specifications and reactance data.",
              image: finalProduct.engineBrand === "Escorts" ? "/assets/products/escorts/escort_40kva_4.jpg" : "/assets/products/parts/enclosure.jpg",
              alt: "Electrical performance",
              specs: [
                { label: "Short Circuit Ratio", value: finalProduct.engineBrand === "Escorts" ? (Number(finalProduct.kva) === 15 ? "0.515" : "0.410") : "0.450" },
                { label: "Voltage Regulation", value: "±1%" },
                { label: "Battery", value: "60 Ah" },
              ],
            };
            if (videoIdx !== -1) {
              finalProduct.sections.splice(videoIdx, 0, newElectrical);
            } else {
              finalProduct.sections.push(newElectrical);
            }
            // Renumber subsequent sections
            finalProduct.sections.forEach((s, idx) => {
              s.number = String(idx + 1).padStart(2, '0');
            });
          }

          // Always ensure video section exists with correct Supabase URL
          const SHOWCASE_VIDEO_URL = "https://vbbeibweeavuksmvkbnb.supabase.co/storage/v1/object/public/product-assets/product-video.mp4";
          const VIDEO_THUMB_URL = "/assets/products/showcase/main-view-optimized.jpg";
          const legacyVideoSec = finalProduct.sections.find(s => s.id === "video");
          if (!legacyVideoSec) {
            const lastNum = finalProduct.sections.length > 0 
              ? parseInt(finalProduct.sections[finalProduct.sections.length - 1].number) 
              : 0;
            finalProduct.sections.push({
              id: "video",
              number: String(lastNum + 1).padStart(2, '0'),
              title: "Product Video",
              tagline: "360° Product Showcase — Experience the engineering and build quality in detail.",
              image: VIDEO_THUMB_URL,
              videoUrl: SHOWCASE_VIDEO_URL,
              alt: `${finalProduct.name} 360 degree showcase`,
              specs: [
                { label: "Duration", value: "8 sec" },
                { label: "Format", value: "MP4" },
                { label: "Source", value: "360° View" },
              ],
            });
          } else {
            // Always force the Supabase URL — override whatever static data has
            legacyVideoSec.videoUrl = SHOWCASE_VIDEO_URL;
            if (!legacyVideoSec.image) legacyVideoSec.image = VIDEO_THUMB_URL;
            legacyVideoSec.tagline = "360° Product Showcase — Experience the engineering and build quality in detail.";
          }
          if (!finalProduct.hotspots.find(h => h.id === "video")) {
            finalProduct.hotspots.push({
              id: "video",
              x: 50, y: 50,
              title: "Product Video",
              description: `Experience the ${finalProduct.name} in action with our official 360° showcase film.`,
              specs: [{ label: "Showcase", value: "360° View" }],
              zoom: 1, offsetX: 0, offsetY: 0,
            });
          }

          setProduct(finalProduct);
          console.log("Product state set, loading CMS...");
          await loadProductCMS(data.product.id);
          console.log("CMS loaded.");
        } else if (staticData) {
          // Fallback to static data if DB is empty for this slug
          console.log("Using static data fallback for:", slug);
          
          // Apply same safety check for static data
          const finalProduct = { ...staticData };
          
          // Ensure Electrical section exists
          if (!finalProduct.sections.find(s => s.id === "electrical")) {
            const videoIdx = finalProduct.sections.findIndex(s => s.id === "video");
            const newElectrical = {
              id: "electrical",
              number: "10",
              title: "Electrical Performance",
              tagline: "Comprehensive electrical specifications and reactance data.",
              image: finalProduct.engineBrand === "Escorts" ? "/assets/products/escorts/escort_40kva_4.jpg" : "/assets/products/parts/enclosure.jpg",
              alt: "Electrical performance",
              specs: [
                { label: "Short Circuit Ratio", value: finalProduct.engineBrand === "Escorts" ? (Number(finalProduct.kva) === 15 ? "0.515" : "0.410") : "0.450" },
                { label: "Voltage Regulation", value: "±1%" },
                { label: "Battery", value: "60 Ah" },
              ],
            };
            if (videoIdx !== -1) {
              finalProduct.sections.splice(videoIdx, 0, newElectrical);
            } else {
              finalProduct.sections.push(newElectrical);
            }
            // Renumber
            finalProduct.sections.forEach((s, idx) => s.number = String(idx + 1).padStart(2, '0'));
          }

          // Always ensure video section exists with correct Supabase URL
          const STATIC_VIDEO_URL = "https://vbbeibweeavuksmvkbnb.supabase.co/storage/v1/object/public/product-assets/product-video.mp4";
          const staticVideoSec = finalProduct.sections.find(s => s.id === "video");
          if (!staticVideoSec) {
            finalProduct.sections = [...finalProduct.sections, {
              id: "video",
              number: String(finalProduct.sections.length + 1).padStart(2, '0'),
              title: "Product Video",
              tagline: "360° Product Showcase — Experience the engineering and build quality in detail.",
              image: "/assets/products/showcase/main-view-optimized.jpg",
              videoUrl: STATIC_VIDEO_URL,
              alt: `${finalProduct.name} 360 degree showcase`,
              specs: [
                { label: "Duration", value: "8 sec" },
                { label: "Format", value: "MP4" },
                { label: "Source", value: "360° View" },
              ],
            }];
          } else {
            // Always force the Supabase URL — override whatever static data has
            staticVideoSec.videoUrl = STATIC_VIDEO_URL;
            if (!staticVideoSec.image) staticVideoSec.image = "/assets/products/showcase/main-view-optimized.jpg";
            staticVideoSec.tagline = "360° Product Showcase — Experience the engineering and build quality in detail.";
          }
          if (!finalProduct.hotspots.find(h => h.id === "video")) {
            finalProduct.hotspots = [...finalProduct.hotspots, {
              id: "video",
              x: 50, y: 50,
              title: "Product Video",
              description: `Experience the ${finalProduct.name} in action with our official 360° showcase film.`,
              specs: [{ label: "Showcase", value: "360° View" }],
              zoom: 1, offsetX: 0, offsetY: 0,
            }];
          }
          setProduct(finalProduct);
        }
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Safety timeout to prevent stuck loading
    const timer = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timer);
  }, [slug, loadProductCMS]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isCMSPreview && !product) {
    return (
      <section className="container-x py-32 text-center">
        <SEO title="Coming soon | Adityagenset" />
        <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">Coming soon</div>
        <h1 className="mt-3 font-display text-5xl font-semibold">This story is on its way.</h1>
        <p className="mt-4 text-muted-foreground">Verified specs and imagery for this product are being prepared.</p>
        <Link to="/products" className="mt-8 inline-flex items-center gap-2 story-link">
          <ArrowLeft size={14} /> Back to catalog
        </Link>
      </section>
    );
  }

  const activeProduct = product!;
  const isEscorts = activeProduct.engineBrand === "Escorts";
  
  // Decide which CMS section to use for editing (dynamic products use showcaseData as base)
  const sectionId = isCMSPreview ? pageId : (isEscorts ? "ekl15ShowcaseData" : "showcaseData");
  const sectionKey = sectionId as "showcaseData";
  
  // If the DB CMS row is missing, content falls back to global defaults.
  // We want to detect if we are seeing default template text for a product that isn't the template's subject.
  const isBaudouinFallback = content?.showcaseData?.productName === "62.5 kVA Silent DG Set" && activeProduct.slug !== "silent-62-5";
  const isEscortFallback = content?.ekl15ShowcaseData?.productName === "EKL 15 kVA (2 Cyl) DG Set" && activeProduct.slug !== "ekl-15-2cyl";
  
  const isFallback = isEscorts ? isEscortFallback : isBaudouinFallback;
  const productName = isFallback ? activeProduct.name : (content?.[sectionKey]?.productName || activeProduct.name);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    brand: { "@type": "Brand", name: "Adityagenset" },
    description: `${activeProduct.kva} kVA silent diesel generator set, CPCB IV+ compliant.`,
    category: "Diesel generator set",
  };

  return (
    <div className="relative">
      <SEO title={`${productName} | Adityagenset`} description={`High-performance ${activeProduct.kva} kVA Silent DG Set powered by ${activeProduct.engineBrand}. CPCB IV+ compliant and ISO 8528 certified.`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* Header overlay removed to avoid duplication with ScrollStory sticky panel */}


      {/* ── Full-height scroll story — first chapter respects header height ── */}
      <ScrollStory
        product={activeProduct}
        sectionId={sectionKey}
        firstChapterOffset={112}
        onChapterChange={setActiveChapter}
        chapterDataMap={v2Product?.chapterDataMap}
      />


    </div>
  );
}

