/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// Safe cast to avoid TS compile-time errors regarding standard ImportMeta type declarations
const metaEnv = (import.meta as any).env || {};

const supabaseUrl = (metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = (): boolean => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

// Initialize client only if configurations exist, avoiding crashing when keys are not defined yet
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Standard helper type definition for database matching our clients setup
export interface DBTypeCustomer {
  id: string;
  name: string;
  water_meter: string;
  electricity_meter: string;
  wifi_code: string;
  created_at: string;
  updated_at: string;
}
