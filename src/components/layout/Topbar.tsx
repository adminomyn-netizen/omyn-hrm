import { Bell, Search } from "lucide-react";

export function Topbar({ tieuDe }: { tieuDe: string }) {
  return (
    <header className="flex items-center justify-between border-b border-omyn-border bg-omyn-surface px-4 py-4 lg:px-8">
      <h1 className="text-lg font-semibold text-slate-900">{tieuDe}</h1>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-omyn-border bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          Tìm kiếm...
        </div>
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-omyn-accent" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-omyn-primary-light text-sm font-semibold text-omyn-primary-dark">
          L
        </div>
      </div>
    </header>
  );
}
