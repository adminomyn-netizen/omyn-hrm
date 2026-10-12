"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { xoaNhanVien } from "@/lib/actions";

export function HanhDongNhanVien({ id, hoTen }: { id: string; hoTen: string }) {
  const [dangXoa, startXoa] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/nhan-su/${id}/sua`}
        title="Sửa thông tin"
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-omyn-primary dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        title="Xóa nhân viên"
        disabled={dangXoa}
        onClick={() => {
          if (!confirm(`Xóa nhân viên "${hoTen}"? Không thể hoàn tác.`)) return;
          const fd = new FormData();
          fd.set("id", id);
          startXoa(() => xoaNhanVien(fd));
        }}
        className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
