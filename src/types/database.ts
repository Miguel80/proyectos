/**
 * Tipos de la base de datos del proyecto Supabase `personal-hub`.
 * Reflejan supabase/migrations/0001 y 0002. Regenéralos tras cada migración con
 * `npm run db:types` o con la herramienta generate_typescript_types del MCP de Supabase.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      bitacora_brews: {
        Row: {
          brewed_at: string;
          created_at: string;
          dose_g: number;
          equipment: string | null;
          grind_setting: string | null;
          id: string;
          method: string;
          notes: string | null;
          product_id: string;
          rating: number | null;
          ratio: number | null;
          steep_seconds: number | null;
          user_id: string;
          water_g: number;
          water_notes: string | null;
          water_temp_c: number | null;
        };
        Insert: {
          brewed_at?: string;
          created_at?: string;
          dose_g: number;
          equipment?: string | null;
          grind_setting?: string | null;
          id?: string;
          method: string;
          notes?: string | null;
          product_id: string;
          rating?: number | null;
          ratio?: number | null;
          steep_seconds?: number | null;
          user_id?: string;
          water_g: number;
          water_notes?: string | null;
          water_temp_c?: number | null;
        };
        Update: {
          brewed_at?: string;
          created_at?: string;
          dose_g?: number;
          equipment?: string | null;
          grind_setting?: string | null;
          id?: string;
          method?: string;
          notes?: string | null;
          product_id?: string;
          rating?: number | null;
          ratio?: number | null;
          steep_seconds?: number | null;
          user_id?: string;
          water_g?: number;
          water_notes?: string | null;
          water_temp_c?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "bitacora_brews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "bitacora_products";
            referencedColumns: ["id"];
          },
        ];
      };
      bitacora_products: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          name: string;
          notes: string | null;
          origin_country: string | null;
          process: string | null;
          producer: string | null;
          purchased_on: string | null;
          region: string | null;
          roast_date: string | null;
          roast_level: string | null;
          supplier: string | null;
          tea_type: string | null;
          user_id: string;
          variety: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          name: string;
          notes?: string | null;
          origin_country?: string | null;
          process?: string | null;
          producer?: string | null;
          purchased_on?: string | null;
          region?: string | null;
          roast_date?: string | null;
          roast_level?: string | null;
          supplier?: string | null;
          tea_type?: string | null;
          user_id?: string;
          variety?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
          notes?: string | null;
          origin_country?: string | null;
          process?: string | null;
          producer?: string | null;
          purchased_on?: string | null;
          region?: string | null;
          roast_date?: string | null;
          roast_level?: string | null;
          supplier?: string | null;
          tea_type?: string | null;
          user_id?: string;
          variety?: string | null;
        };
        Relationships: [];
      };
      bitacora_tastings: {
        Row: {
          acidity: number | null;
          aftertaste: number | null;
          aroma: number | null;
          balance: number | null;
          bitterness: number | null;
          body: number | null;
          brew_id: string;
          created_at: string;
          descriptors: string[];
          id: string;
          notes: string | null;
          sweetness: number | null;
          user_id: string;
        };
        Insert: {
          acidity?: number | null;
          aftertaste?: number | null;
          aroma?: number | null;
          balance?: number | null;
          bitterness?: number | null;
          body?: number | null;
          brew_id: string;
          created_at?: string;
          descriptors?: string[];
          id?: string;
          notes?: string | null;
          sweetness?: number | null;
          user_id?: string;
        };
        Update: {
          acidity?: number | null;
          aftertaste?: number | null;
          aroma?: number | null;
          balance?: number | null;
          bitterness?: number | null;
          body?: number | null;
          brew_id?: string;
          created_at?: string;
          descriptors?: string[];
          id?: string;
          notes?: string | null;
          sweetness?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bitacora_tastings_brew_id_fkey";
            columns: ["brew_id"];
            isOneToOne: true;
            referencedRelation: "bitacora_brews";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          title: string;
          user_id?: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
