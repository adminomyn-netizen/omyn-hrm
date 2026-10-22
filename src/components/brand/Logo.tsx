import Image from "next/image";

type KichThuocLogo = "sm" | "md" | "lg";

const CAO: Record<KichThuocLogo, number> = { sm: 20, md: 28, lg: 40 };

/** Biểu tượng rút gọn: chữ "O" vẽ riêng (nét dày–mỏng) + hạt rêu. Bản gốc ở
 * public/brand/bieu-tuong.svg, dựng bằng scripts/dung-logo.mjs. */
export function LogoMark({ size = "md", className }: { size?: KichThuocLogo; className?: string }) {
  const h = CAO[size];
  return (
    <>
      <Image src="/brand/bieu-tuong.svg" alt="OMYN" width={h} height={h} unoptimized className={`dark:hidden ${className ?? ""}`} />
      <Image src="/brand/bieu-tuong-sang.svg" alt="OMYN" width={h} height={h} unoptimized className={`hidden dark:block ${className ?? ""}`} />
    </>
  );
}

/** Logo ngang: chữ OMYN (Cormorant Garamond chuyển thành đường) + "O" vẽ riêng. */
export function Logo({
  size = "md",
  nenToi = false,
  className,
}: {
  size?: KichThuocLogo;
  /** true khi đặt trên mảng tối espresso: chữ sáng ngà, hạt vàng. */
  nenToi?: boolean;
  className?: string;
}) {
  const h = CAO[size];
  const w = Math.round(h * 4.3);
  if (nenToi) {
    return <Image src="/brand/logo-tren-nen-toi.svg" alt="OMYN" width={w} height={h} unoptimized className={className} />;
  }
  return (
    <>
      <Image src="/brand/logo-ngang.svg" alt="OMYN" width={w} height={h} unoptimized className={`dark:hidden ${className ?? ""}`} />
      <Image src="/brand/logo-tren-nen-toi.svg" alt="OMYN" width={w} height={h} unoptimized className={`hidden dark:block ${className ?? ""}`} />
    </>
  );
}
