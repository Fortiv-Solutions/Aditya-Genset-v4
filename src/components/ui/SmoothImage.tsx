import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SmoothImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  imageClassName?: string;
  fallbackSrc?: string;
}

export function SmoothImage({ 
  className, 
  wrapperClassName, 
  imageClassName,
  alt, 
  fallbackSrc = "/assets/products/showcase/main-view-optimized.jpg",
  src,
  ...props 
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setCurrentSrc(src);
    setErrorCount(0);
  }, [src]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const handleError = () => {
    if (errorCount === 0 && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setErrorCount(1);
    }
    setIsLoaded(true);
  };

  return (
    <div className={cn("overflow-hidden relative bg-secondary/30", wrapperClassName, className)}>
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]",
          isLoaded ? "hidden" : "block"
        )} 
      />
      
      <img
        {...props}
        ref={imgRef}
        src={currentSrc}
        alt={alt || "Image"}
        decoding={props.decoding || "async"}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={cn(
          "h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm",
          imageClassName
        )}
      />
    </div>
  );
}
