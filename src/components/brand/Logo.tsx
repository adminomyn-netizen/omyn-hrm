import Image from "next/image";

type KichThuocLogo = "sm" | "md" | "lg";

const CAO: Record<KichThuocLogo, number> = { sm: 20, md: 28, lg: 40 };

/** Biểu tượng rút gọn: chữ "O" vẽ riêng (nét dày–mỏng) + hạt rêu. Bản gốc ở
 * public/brand/bieu-tuong.svg, dựng bằng scripts/dung-logo.mjs. */
export function LogoMark({ size = "md", className }: { size?: KichThuocLogo; className?: string }) {
  const h = CAO[size];
  return (
    <Image
      src="/brand/bieu-tuong.svg"
      alt="OMYN"
      width={h}
      height={h}
      unoptimized
      className={className}
    />
  );
}

/** Logo ngang: chữ OMYN (Cormorant Garamond chuyển thành đường) + "O" vẽ riêng. */
export function Logo({ size = "md", className }: { size?: KichThuocLogo; className?: string }) {
  const h = CAO[size];
  return (
    <Image
      src="/brand/logo-ngang.svg"
      alt="OMYN"
      width={Math.round(h * 4.3)}
      height={h}
      unoptimized
      className={className}
    />
  );
}
