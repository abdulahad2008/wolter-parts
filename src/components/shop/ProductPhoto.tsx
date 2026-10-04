/* eslint-disable @next/next/no-img-element */
import type { ProductImage } from "@/lib/schema";
import { ImageIcon } from "../icons";

/** A square product photo; shows a quiet placeholder when the product has no photo yet. */
export function ProductPhoto({
  image,
  alt,
  sizes = "(min-width: 768px) 25vw, 50vw",
  priority,
  className = "",
}: {
  image?: ProductImage;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) {
    return (
      <span className={`flex aspect-square w-full items-center justify-center bg-tile text-faint ${className}`}>
        <ImageIcon size={40} strokeWidth={1.4} />
      </span>
    );
  }
  return (
    <img
      src={`/media/${image.key}-480.webp`}
      srcSet={`/media/${image.key}-480.webp 480w, /media/${image.key}-1200.webp 1200w`}
      sizes={sizes}
      width={1200}
      height={1200}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`block aspect-square w-full bg-tile object-cover ${className}`}
    />
  );
}
