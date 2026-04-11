import Link from "next/link";
import { OFFICIAL_LOGO_URL } from "@/lib/official-logo";

type Variant = "footer" | "success";

const variantClass: Record<
  Variant,
  { img: string; width: number; height: number }
> = {
  footer: {
    img: "h-24 w-auto max-w-[min(400px,90vw)] object-contain object-left opacity-95 sm:max-w-[400px]",
    width: 480,
    height: 144,
  },
  success: {
    img: "h-16 w-auto max-w-[min(320px,88vw)] object-contain object-center sm:h-[4.5rem]",
    width: 360,
    height: 108,
  },
};

/**
 * Logo de marca para zonas puntuales (pie, confirmación).
 * No usar en cabecera global: ya existe `SiteHeader`.
 */
export function BrandLogo({
  variant,
  alt,
  className = "",
}: {
  variant: Variant;
  alt: string;
  className?: string;
}) {
  const v = variantClass[variant];
  const wrap =
    variant === "footer"
      ? "flex justify-center sm:justify-start"
      : "flex justify-center";

  return (
    <div className={`${wrap} ${className}`}>
      <Link
        href="/"
        className="inline-block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={OFFICIAL_LOGO_URL}
          alt={alt}
          width={v.width}
          height={v.height}
          decoding="async"
          className={v.img}
        />
      </Link>
    </div>
  );
}
