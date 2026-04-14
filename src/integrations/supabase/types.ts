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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alat: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          jumlah: number
          kategori_id: string | null
          kode_alat: string
          kondisi: string
          nama: string
          tersedia: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jumlah?: number
          kategori_id?: string | null
          kode_alat: string
          kondisi?: string
          nama: string
          tersedia?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          jumlah?: number
          kategori_id?: string | null
          kode_alat?: string
          kondisi?: string
          nama?: string
          tersedia?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alat_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama?: string
        }
        Relationships: []
      }
      log_aktivitas: {
        Row: {
          aksi: string
          created_at: string
          detail: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          detail?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      peminjaman: {
        Row: {
          alat_id: string
          catatan: string | null
          created_at: string
          disetujui_oleh: string | null
          id: string
          jumlah: number
          peminjam_id: string
          status: string
          tanggal_kembali_rencana: string
          tanggal_pinjam: string
          updated_at: string
        }
        Insert: {
          alat_id: string
          catatan?: string | null
          created_at?: string
          disetujui_oleh?: string | null
          id?: string
          jumlah?: number
          peminjam_id: string
          status?: string
          tanggal_kembali_rencana: string
          tanggal_pinjam?: string
          updated_at?: string
        }
        Update: {
          alat_id?: string
          catatan?: string | null
          created_at?: string
          disetujui_oleh?: string | null
          id?: string
          jumlah?: number
          peminjam_id?: string
          status?: string
          tanggal_kembali_rencana?: string
          tanggal_pinjam?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peminjaman_alat_id_fkey"
            columns: ["alat_id"]
            isOneToOne: false
            referencedRelation: "alat"
            referencedColumns: ["id"]
          },
        ]
      }
      pengembalian: {
        Row: {
          created_at: string
          denda: number
          diterima_oleh: string | null
          id: string
          keterangan: string | null
          kondisi_alat: string
          peminjaman_id: string
          tanggal_kembali: string
        }
        Insert: {
          created_at?: string
          denda?: number
          diterima_oleh?: string | null
          id?: string
          keterangan?: string | null
          kondisi_alat?: string
          peminjaman_id: string
          tanggal_kembali?: string
        }
        Update: {
          created_at?: string
          denda?: number
          diterima_oleh?: string | null
          id?: string
          keterangan?: string | null
          kondisi_alat?: string
          peminjaman_id?: string
          tanggal_kembali?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengembalian_peminjaman_id_fkey"
            columns: ["peminjaman_id"]
            isOneToOne: false
            referencedRelation: "peminjaman"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_activity: {
        Args: { _aksi: string; _detail?: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "petugas" | "peminjam"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "petugas", "peminjam"],
    },
  },
} as const
