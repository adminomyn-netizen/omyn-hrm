/** Khung chờ hiện NGAY khi bấm đổi trang (trước khi dữ liệu về): cùng bố cục với trang thật nên không nhảy hình. */
export default function DangTai() {
  return (
    <div data-dang-tai aria-busy="true" aria-label="Đang tải" className="animate-pulse">
      <div className="grid grid-cols-2 gap-y-6 border-y border-vien py-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`px-1 sm:px-6 ${i > 0 ? "sm:border-l sm:border-vien" : ""}`}>
            <div className="h-8 w-16 bg-giay-tram" style={{ borderRadius: 4 }} />
            <div className="mt-3 h-3 w-24 bg-giay-tram" style={{ borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="mt-8 h-6 w-44 bg-giay-tram" style={{ borderRadius: 4 }} />
      <div className="mt-4 space-y-0">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex h-[60px] items-center gap-6 border-b border-vien">
            <div className="h-4 w-40 bg-giay-tram" style={{ borderRadius: 4 }} />
            <div className="h-4 w-28 bg-giay-tram" style={{ borderRadius: 4 }} />
            <div className="hidden h-4 w-24 bg-giay-tram sm:block" style={{ borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
