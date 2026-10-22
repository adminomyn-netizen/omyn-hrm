import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DUONG_DAN_CONG_KHAI = ["/dang-nhap", "/dang-ky"];

export async function capNhatPhien(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const laTrangCongKhai = DUONG_DAN_CONG_KHAI.some((d) => request.nextUrl.pathname.startsWith(d));

  if (!user && !laTrangCongKhai) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    return NextResponse.redirect(url);
  }

  const vaiTro = user?.app_metadata?.vai_tro;
  const daDuyet = vaiTro === "admin" || vaiTro === "ky_thuat" || vaiTro === "nhan_vien";

  if (user && laTrangCongKhai) {
    const url = request.nextUrl.clone();
    url.pathname = !daDuyet ? "/cho-duyet" : vaiTro === "nhan_vien" ? "/cham-cong" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Chưa được duyệt: chỉ được ở /cho-duyet (chặn ngay ở cổng, không phụ thuộc thứ tự dựng trang).
  if (user && !daDuyet && !request.nextUrl.pathname.startsWith("/cho-duyet")) {
    const url = request.nextUrl.clone();
    url.pathname = "/cho-duyet";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
