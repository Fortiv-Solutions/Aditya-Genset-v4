import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/data/products";
import { ArrowRight } from "lucide-react";
import { SmoothImage } from "@/components/ui/SmoothImage";

interface Props {
  product: ProductSummary;
}

export function ProductCard({ product }: Props) {
  const isActive = product.status === "active";
  const inner = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card transition-all duration-500 ease-brand",
        isActive ? "hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl" : "opacity-70",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <SmoothImage
          src={product.thumbnail}
          alt={product.name}
          loading="eager"
          wrapperClassName="h-full w-full"
          imageClassName={cn(
            "h-full w-full object-cover transition-transform duration-1000 ease-brand",
            isActive ? "group-hover:scale-110" : "grayscale",
          )}
        />
        {!isActive && (
          <div className="absolute left-3 top-3 rounded-sm bg-foreground/85 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-background">
            Coming soon
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="font-display text-xs uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-accent">
            {product.range} kVA range
          </div>
          <div className="mt-2 font-display text-xl font-semibold leading-tight transition-colors group-hover:text-foreground">
            {product.name}
          </div>
        </div>
        {isActive ? (
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition-all group-hover:gap-3">
            View story <ArrowRight size={14} className="transition-transform duration-300 ease-brand group-hover:translate-x-1" />
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">Available on request</div>
        )}
      </div>
    </div>
  );
  if (!isActive) return <div aria-disabled>{inner}</div>;
  return <Link to={`/products/${product.slug}`}>{inner}</Link>;
}
