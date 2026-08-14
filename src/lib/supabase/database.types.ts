/**
 * PLACEHOLDER — replace with generated types.
 *
 * Once the Supabase project is linked, run:
 *     pnpm db:types
 * which overwrites this file with fully-typed rows, enums and RPC signatures
 * derived from the real schema. Until then this permissive shape keeps the
 * client generic satisfied without inventing types that could drift from
 * supabase/migrations/.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

type PlaceholderTable = {
  Row: AnyRow
  Insert: AnyRow
  Update: AnyRow
  Relationships: []
}

type PlaceholderFunction = {
  Args: AnyRow
  Returns: unknown
}

export type Database = {
  public: {
    Tables: Record<string, PlaceholderTable>
    Views: Record<string, PlaceholderTable>
    Functions: Record<string, PlaceholderFunction>
    Enums: Record<string, string>
    CompositeTypes: Record<string, AnyRow>
  }
}
