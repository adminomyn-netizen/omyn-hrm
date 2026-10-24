export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bang_luong: {
        Row: {
          an_ca: boolean
          bh_cty: number
          bh_tn: number
          bh_xh: number
          bh_yt: number
          cong_chuan: number
          cong_huong: number
          dong_bh: boolean
          ghi_chu: string | null
          giam_tru: number
          gio_ot_le: number
          gio_ot_nghi_tuan: number
          gio_ot_thuong: number
          hoa_hong: number
          id: string
          khau_tru_khac: number
          kieu_cong: string
          ky_luong_id: string
          luong_chuc_danh: number
          luong_co_ban: number
          luong_kpi: number
          luong_thoa_thuan: number
          ngay_lam: number
          nhan_vien_id: string
          phu_cap: number
          phu_cap_mien_thue: boolean
          phu_cap_thuc: number
          so_nguoi_phu_thuoc: number
          thu_nhap_tinh_thue: number
          thu_viec: boolean
          thuc_linh: number
          thue_tncn: number
          thuong_khac: number
          tien_an: number
          tien_ot: number
          tinh_luc: string | null
          tong_thu_nhap: number
          ty_le_ht_kpi: number
          ty_le_kpi: number
        }
        Insert: {
          an_ca?: boolean
          bh_cty?: number
          bh_tn?: number
          bh_xh?: number
          bh_yt?: number
          cong_chuan?: number
          cong_huong?: number
          dong_bh?: boolean
          ghi_chu?: string | null
          giam_tru?: number
          gio_ot_le?: number
          gio_ot_nghi_tuan?: number
          gio_ot_thuong?: number
          hoa_hong?: number
          id?: string
          khau_tru_khac?: number
          kieu_cong?: string
          ky_luong_id: string
          luong_chuc_danh?: number
          luong_co_ban?: number
          luong_kpi?: number
          luong_thoa_thuan?: number
          ngay_lam?: number
          nhan_vien_id: string
          phu_cap?: number
          phu_cap_mien_thue?: boolean
          phu_cap_thuc?: number
          so_nguoi_phu_thuoc?: number
          thu_nhap_tinh_thue?: number
          thu_viec?: boolean
          thuc_linh?: number
          thue_tncn?: number
          thuong_khac?: number
          tien_an?: number
          tien_ot?: number
          tinh_luc?: string | null
          tong_thu_nhap?: number
          ty_le_ht_kpi?: number
          ty_le_kpi?: number
        }
        Update: {
          an_ca?: boolean
          bh_cty?: number
          bh_tn?: number
          bh_xh?: number
          bh_yt?: number
          cong_chuan?: number
          cong_huong?: number
          dong_bh?: boolean
          ghi_chu?: string | null
          giam_tru?: number
          gio_ot_le?: number
          gio_ot_nghi_tuan?: number
          gio_ot_thuong?: number
          hoa_hong?: number
          id?: string
          khau_tru_khac?: number
          kieu_cong?: string
          ky_luong_id?: string
          luong_chuc_danh?: number
          luong_co_ban?: number
          luong_kpi?: number
          luong_thoa_thuan?: number
          ngay_lam?: number
          nhan_vien_id?: string
          phu_cap?: number
          phu_cap_mien_thue?: boolean
          phu_cap_thuc?: number
          so_nguoi_phu_thuoc?: number
          thu_nhap_tinh_thue?: number
          thu_viec?: boolean
          thuc_linh?: number
          thue_tncn?: number
          thuong_khac?: number
          tien_an?: number
          tien_ot?: number
          tinh_luc?: string | null
          tong_thu_nhap?: number
          ty_le_ht_kpi?: number
          ty_le_kpi?: number
        }
        Relationships: [
          {
            foreignKeyName: "bang_luong_ky_luong_id_fkey"
            columns: ["ky_luong_id"]
            isOneToOne: false
            referencedRelation: "ky_luong"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bang_luong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      cham_cong: {
        Row: {
          gio_ra: string | null
          gio_vao: string | null
          id: string
          ngay: string
          nhan_vien_id: string
          trang_thai: string
        }
        Insert: {
          gio_ra?: string | null
          gio_vao?: string | null
          id?: string
          ngay: string
          nhan_vien_id: string
          trang_thai?: string
        }
        Update: {
          gio_ra?: string | null
          gio_vao?: string | null
          id?: string
          ngay?: string
          nhan_vien_id?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "cham_cong_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      danh_gia_hieu_suat: {
        Row: {
          created_at: string
          diem: number
          id: string
          ky: string
          nguoi_danh_gia_id: string | null
          nhan_vien_id: string
          xep_loai: string
        }
        Insert: {
          created_at?: string
          diem: number
          id?: string
          ky: string
          nguoi_danh_gia_id?: string | null
          nhan_vien_id: string
          xep_loai: string
        }
        Update: {
          created_at?: string
          diem?: number
          id?: string
          ky?: string
          nguoi_danh_gia_id?: string | null
          nhan_vien_id?: string
          xep_loai?: string
        }
        Relationships: [
          {
            foreignKeyName: "danh_gia_hieu_suat_nguoi_danh_gia_id_fkey"
            columns: ["nguoi_danh_gia_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "danh_gia_hieu_suat_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      don_tu: {
        Row: {
          created_at: string
          den_ngay: string
          gio_den: string | null
          gio_ra_dung: string | null
          gio_tu: string | null
          gio_vao_dung: string | null
          id: string
          loai: string
          ly_do: string | null
          nguoi_duyet_id: string | null
          nhan_vien_id: string
          trang_thai: string
          tu_ngay: string
        }
        Insert: {
          created_at?: string
          den_ngay: string
          gio_den?: string | null
          gio_ra_dung?: string | null
          gio_tu?: string | null
          gio_vao_dung?: string | null
          id?: string
          loai: string
          ly_do?: string | null
          nguoi_duyet_id?: string | null
          nhan_vien_id: string
          trang_thai?: string
          tu_ngay: string
        }
        Update: {
          created_at?: string
          den_ngay?: string
          gio_den?: string | null
          gio_ra_dung?: string | null
          gio_tu?: string | null
          gio_vao_dung?: string | null
          id?: string
          loai?: string
          ly_do?: string | null
          nguoi_duyet_id?: string | null
          nhan_vien_id?: string
          trang_thai?: string
          tu_ngay?: string
        }
        Relationships: [
          {
            foreignKeyName: "don_tu_nguoi_duyet_id_fkey"
            columns: ["nguoi_duyet_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "don_tu_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      gan_vai_tro: {
        Row: {
          created_at: string
          hieu_luc_den: string | null
          hieu_luc_tu: string
          id: string
          nguoi_gan: string | null
          user_id: string
          vai_tro: string
        }
        Insert: {
          created_at?: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string
          id?: string
          nguoi_gan?: string | null
          user_id: string
          vai_tro: string
        }
        Update: {
          created_at?: string
          hieu_luc_den?: string | null
          hieu_luc_tu?: string
          id?: string
          nguoi_gan?: string | null
          user_id?: string
          vai_tro?: string
        }
        Relationships: [
          {
            foreignKeyName: "gan_vai_tro_vai_tro_fkey"
            columns: ["vai_tro"]
            isOneToOne: false
            referencedRelation: "vai_tro"
            referencedColumns: ["ma"]
          },
        ]
      }
      gioi_han_cung: {
        Row: {
          hanh_dong: string
          module: string
          pham_vi_toi_da: string
          vai_tro: string
        }
        Insert: {
          hanh_dong: string
          module: string
          pham_vi_toi_da: string
          vai_tro: string
        }
        Update: {
          hanh_dong?: string
          module?: string
          pham_vi_toi_da?: string
          vai_tro?: string
        }
        Relationships: [
          {
            foreignKeyName: "gioi_han_cung_vai_tro_fkey"
            columns: ["vai_tro"]
            isOneToOne: false
            referencedRelation: "vai_tro"
            referencedColumns: ["ma"]
          },
        ]
      }
      khoi: {
        Row: {
          id: string
          mo_ta: string | null
          ten: string
        }
        Insert: {
          id?: string
          mo_ta?: string | null
          ten: string
        }
        Update: {
          id?: string
          mo_ta?: string | null
          ten?: string
        }
        Relationships: []
      }
      ky_luong: {
        Row: {
          chuyen_luc: string | null
          da_thanh_toan: boolean
          ghi_chu: string | null
          id: string
          nam: number | null
          ten_ky: string
          thang: number | null
          trang_thai: string
        }
        Insert: {
          chuyen_luc?: string | null
          da_thanh_toan?: boolean
          ghi_chu?: string | null
          id?: string
          nam?: number | null
          ten_ky: string
          thang?: number | null
          trang_thai?: string
        }
        Update: {
          chuyen_luc?: string | null
          da_thanh_toan?: boolean
          ghi_chu?: string | null
          id?: string
          nam?: number | null
          ten_ky?: string
          thang?: number | null
          trang_thai?: string
        }
        Relationships: []
      }
      luong_thoa_thuan: {
        Row: {
          an_ca: boolean
          cap_nhat_luc: string
          dong_bh: boolean
          ghi_chu: string | null
          kieu_cong: string
          luong_thoa_thuan: number
          nhan_vien_id: string
          phu_cap: number
          phu_cap_mien_thue: boolean
          so_nguoi_phu_thuoc: number
          ty_le_kpi: number
        }
        Insert: {
          an_ca?: boolean
          cap_nhat_luc?: string
          dong_bh?: boolean
          ghi_chu?: string | null
          kieu_cong?: string
          luong_thoa_thuan: number
          nhan_vien_id: string
          phu_cap?: number
          phu_cap_mien_thue?: boolean
          so_nguoi_phu_thuoc?: number
          ty_le_kpi?: number
        }
        Update: {
          an_ca?: boolean
          cap_nhat_luc?: string
          dong_bh?: boolean
          ghi_chu?: string | null
          kieu_cong?: string
          luong_thoa_thuan?: number
          nhan_vien_id?: string
          phu_cap?: number
          phu_cap_mien_thue?: boolean
          so_nguoi_phu_thuoc?: number
          ty_le_kpi?: number
        }
        Relationships: [
          {
            foreignKeyName: "luong_thoa_thuan_nhan_vien_id_fkey"
            columns: ["nhan_vien_id"]
            isOneToOne: true
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      ngay_le: {
        Row: {
          ngay: string
          tao_luc: string
          ten: string
        }
        Insert: {
          ngay: string
          tao_luc?: string
          ten: string
        }
        Update: {
          ngay?: string
          tao_luc?: string
          ten?: string
        }
        Relationships: []
      }
      nhan_vien: {
        Row: {
          chuc_danh: string | null
          created_at: string
          email: string | null
          ho_ten: string
          id: string
          khoi_id: string | null
          ma_nhan_vien: string | null
          ngay_vao_lam: string | null
          quan_ly_id: string | null
          quan_ly_phu_id: string | null
          tai_khoan_hoat_dong: boolean
          trang_thai: string
          user_id: string | null
        }
        Insert: {
          chuc_danh?: string | null
          created_at?: string
          email?: string | null
          ho_ten: string
          id?: string
          khoi_id?: string | null
          ma_nhan_vien?: string | null
          ngay_vao_lam?: string | null
          quan_ly_id?: string | null
          quan_ly_phu_id?: string | null
          tai_khoan_hoat_dong?: boolean
          trang_thai?: string
          user_id?: string | null
        }
        Update: {
          chuc_danh?: string | null
          created_at?: string
          email?: string | null
          ho_ten?: string
          id?: string
          khoi_id?: string | null
          ma_nhan_vien?: string | null
          ngay_vao_lam?: string | null
          quan_ly_id?: string | null
          quan_ly_phu_id?: string | null
          tai_khoan_hoat_dong?: boolean
          trang_thai?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nhan_vien_khoi_id_fkey"
            columns: ["khoi_id"]
            isOneToOne: false
            referencedRelation: "khoi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_quan_ly_id_fkey"
            columns: ["quan_ly_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nhan_vien_quan_ly_phu_id_fkey"
            columns: ["quan_ly_phu_id"]
            isOneToOne: false
            referencedRelation: "nhan_vien"
            referencedColumns: ["id"]
          },
        ]
      }
      nhat_ky: {
        Row: {
          ban_ghi: string | null
          bang: string
          hanh_dong: string
          id: number
          nguoi_thuc_hien: string | null
          sau: Json | null
          thoi_diem: string
          truoc: Json | null
        }
        Insert: {
          ban_ghi?: string | null
          bang: string
          hanh_dong: string
          id?: never
          nguoi_thuc_hien?: string | null
          sau?: Json | null
          thoi_diem?: string
          truoc?: Json | null
        }
        Update: {
          ban_ghi?: string | null
          bang?: string
          hanh_dong?: string
          id?: never
          nguoi_thuc_hien?: string | null
          sau?: Json | null
          thoi_diem?: string
          truoc?: Json | null
        }
        Relationships: []
      }
      quyen_vai_tro: {
        Row: {
          hanh_dong: string
          module: string
          pham_vi: string
          vai_tro: string
        }
        Insert: {
          hanh_dong: string
          module: string
          pham_vi: string
          vai_tro: string
        }
        Update: {
          hanh_dong?: string
          module?: string
          pham_vi?: string
          vai_tro?: string
        }
        Relationships: [
          {
            foreignKeyName: "quyen_vai_tro_vai_tro_fkey"
            columns: ["vai_tro"]
            isOneToOne: false
            referencedRelation: "vai_tro"
            referencedColumns: ["ma"]
          },
        ]
      }
      tham_so_luong: {
        Row: {
          cap_nhat_luc: string
          don_vi: string
          gia_tri: number
          khoa: string
          nguon: string | null
          nhan: string
          xac_nhan_boi: string | null
          xac_nhan_luc: string | null
        }
        Insert: {
          cap_nhat_luc?: string
          don_vi: string
          gia_tri: number
          khoa: string
          nguon?: string | null
          nhan: string
          xac_nhan_boi?: string | null
          xac_nhan_luc?: string | null
        }
        Update: {
          cap_nhat_luc?: string
          don_vi?: string
          gia_tri?: number
          khoa?: string
          nguon?: string | null
          nhan?: string
          xac_nhan_boi?: string | null
          xac_nhan_luc?: string | null
        }
        Relationships: []
      }
      tin_tuyen_dung: {
        Row: {
          created_at: string
          han_nop: string | null
          id: string
          khoi_id: string | null
          mo_ta: string | null
          so_luong_can: number
          trang_thai: string
          vi_tri: string
        }
        Insert: {
          created_at?: string
          han_nop?: string | null
          id?: string
          khoi_id?: string | null
          mo_ta?: string | null
          so_luong_can?: number
          trang_thai?: string
          vi_tri: string
        }
        Update: {
          created_at?: string
          han_nop?: string | null
          id?: string
          khoi_id?: string | null
          mo_ta?: string | null
          so_luong_can?: number
          trang_thai?: string
          vi_tri?: string
        }
        Relationships: [
          {
            foreignKeyName: "tin_tuyen_dung_khoi_id_fkey"
            columns: ["khoi_id"]
            isOneToOne: false
            referencedRelation: "khoi"
            referencedColumns: ["id"]
          },
        ]
      }
      ung_vien: {
        Row: {
          dien_thoai: string | null
          email: string | null
          ghi_chu: string | null
          ho_ten: string
          id: string
          link_cv: string | null
          nam_sinh: number | null
          ngay_nhan_ho_so: string
          ngay_phong_van: string | null
          nguon: string | null
          tin_tuyen_dung_id: string
          trang_thai: string
        }
        Insert: {
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          ho_ten: string
          id?: string
          link_cv?: string | null
          nam_sinh?: number | null
          ngay_nhan_ho_so?: string
          ngay_phong_van?: string | null
          nguon?: string | null
          tin_tuyen_dung_id: string
          trang_thai?: string
        }
        Update: {
          dien_thoai?: string | null
          email?: string | null
          ghi_chu?: string | null
          ho_ten?: string
          id?: string
          link_cv?: string | null
          nam_sinh?: number | null
          ngay_nhan_ho_so?: string
          ngay_phong_van?: string | null
          nguon?: string | null
          tin_tuyen_dung_id?: string
          trang_thai?: string
        }
        Relationships: [
          {
            foreignKeyName: "ung_vien_tin_tuyen_dung_id_fkey"
            columns: ["tin_tuyen_dung_id"]
            isOneToOne: false
            referencedRelation: "tin_tuyen_dung"
            referencedColumns: ["id"]
          },
        ]
      }
      vai_tro: {
        Row: {
          ma: string
          nhay_cam: boolean
          suy_ra: boolean
          ten: string
        }
        Insert: {
          ma: string
          nhay_cam?: boolean
          suy_ra?: boolean
          ten: string
        }
        Update: {
          ma?: string
          nhay_cam?: boolean
          suy_ra?: boolean
          ten?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
