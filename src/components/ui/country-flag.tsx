import Image from "next/image";

type CountryFlagProps = {
  code: string;
  /** Rendered width in px. Height is derived from the 4:3 flag ratio. */
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Renders a country flag as an image rather than an emoji.
 *
 * Regional-indicator flag emoji are not rendered as flags on Windows
 * (Segoe UI Emoji has no flag glyphs), so we serve real flag images that
 * look the same on every platform.
 *
 * Flags ship with different aspect ratios, so the image is placed inside a
 * fixed-size box (object-cover) to keep every flag the same dimensions, with
 * a hairline border so predominantly white flags stay visible on light
 * backgrounds.
 */
export function CountryFlag({ code, size = 20, className, title }: CountryFlagProps) {
  const normalized = code.trim().toLowerCase();
  const height = Math.round((size * 3) / 4);

  if (!/^[a-z]{2}$/.test(normalized)) {
    return (
      <span aria-hidden="true" className={className}>
        🏳
      </span>
    );
  }

  return (
    <span
      title={title}
      aria-hidden={title ? undefined : true}
      className={`inline-flex shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/15 ${className ?? ""}`}
      style={{ width: size, height }}
    >
      <Image
        src={`https://flagcdn.com/${normalized}.svg`}
        width={size}
        height={height}
        alt=""
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}
