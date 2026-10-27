/**
 * Tipos de la base de datos.
 * Coincide con el esquema aplicado en el proyecto Supabase `personal-hub`
 * (migración supabase/migrations/0001_init.sql). Regenéralo tras cada migración con
 * `npm run db:types` o con la herramienta generate_typescript_types del MCP de Supabase.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          body?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          created_at?: string;
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
