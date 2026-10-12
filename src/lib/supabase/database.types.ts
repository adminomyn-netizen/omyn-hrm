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
          id: string
          ky_luong_id: string
          luong_co_ban: number
          nhan_vien_id: string
          phu_cap: number
          thuc_linh: number | null
        }
        Insert: {
          id?: string
          ky_luong_id: string
          luong_co_ban?: number
          nhan_vien_id: string
          phu_cap?: number
          thuc_linh?: number | null
        }
        Update: {
          id?: string
          ky_luong_id?: string
          luong_co_ban?: number
          nhan_vien_id?: string
          phu_cap?: number
          thuc_linh?: number | null
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
          da_thanh_toan: boolean
          id: string
          ten_ky: string
        }
        Insert: {
          da_thanh_toan?: boolean
          id?: string
          ten_ky: string
        }
        Update: {
          da_thanh_toan?: boolean
          id?: string
          ten_ky?: string
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
        ]
      }
      tin_tuyen_dung: {
        Row: {
          created_at: string
          id: string
          khoi_id: string | null
          so_luong_can: number
          trang_thai: string
          vi_tri: string
        }
        Insert: {
          created_at?: string
          id?: string
          khoi_id?: string | null
          so_luong_can?: number
          trang_thai?: string
          vi_tri: string
        }
        Update: {
          created_at?: string
          id?: string
          khoi_id?: string | null
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
          ho_ten: string
          id: string
          tin_tuyen_dung_id: string
          trang_thai: string
        }
        Insert: {
          dien_thoai?: string | null
          email?: string | null
          ho_ten: string
          id?: string
          tin_tuyen_dung_id: string
          trang_thai?: string
        }
        Update: {
          dien_thoai?: string | null
          email?: string | null
          ho_ten?: string
          id?: string
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
