import Image from "next/image";
import Link from "next/link";

const ORG_NAME = "台灣尤塞氏症暨視聽弱協會";
const ORG_NAME_EN = "Taiwan Usher Syndrome and Audiovisual Impairment Association";

interface LogoProps {
  variant?: "header" | "footer";
  href?: string;
  className?: string;
}

/**
 * Split logo: icon + text with Iansui font.
 * Styles match original Logo_long: 台灣 + 暨視聽弱協會 (white), 尤塞氏症 (accent).
 */
export default function Logo({ variant = "header", href = "/", className = "" }: LogoProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2 sm:gap-3 ${className}`}
      style={{ fontFamily: "Iansui, var(--font-sans)" }}
    >
      {/* Icon: left portion of Logo_long (icon only) */}
      <Image
        src="/images/Logo_long.png"
        alt=""
        width={68}
        height={68}
        className={`shrink-0 object-cover object-left ${variant === "header" ? "h-8 w-8 sm:h-12 sm:w-12" : "h-8 w-8"}`}
        sizes={variant === "header" ? "48px" : "40px"}
        aria-hidden
      />
      <span className="flex flex-col justify-center">
        <span
          className={`leading-tight text-white ${variant === "header" ? "text-sm sm:text-xl" : "text-sm"}`}
        >
          <span>台灣</span>
          <span className="text-accent">尤塞氏症</span>
          <span>暨視聽弱協會</span>
        </span>
        {variant === "footer" && (
          <span className="mt-0.5 text-xs font-sans text-white/90 leading-tight">
            {ORG_NAME_EN}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="transition-opacity hover:opacity-90"
        aria-label={`${ORG_NAME} - 回到首頁`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
