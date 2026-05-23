/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured, DBTypeCustomer } from "./supabaseClient";
import { Customer } from "../types";

// Map Database types back to our internal Customer Interface representation
const mapDBToCustomer = (db: DBTypeCustomer): Customer => {
  return {
    id: db.id,
    name: db.name,
    waterMeter: db.water_meter || "",
    electricityMeter: db.electricity_meter || "",
    wifiCode: db.wifi_code || "",
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
};

export interface SupabaseErrorDetail {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseErrorDetail | null;
}

export async function fetchCustomersFromSupabase(): Promise<SupabaseResponse<Customer[]>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase n'est pas ou est mal configuré." } };
  }
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erreur de récupération Supabase:", error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }
    return {
      data: (data as DBTypeCustomer[]).map(mapDBToCustomer),
      error: null
    };
  } catch (e: any) {
    console.error("Erreur d'accès réseau Supabase:", e);
    return {
      data: null,
      error: {
        message: e?.message || "Erreur réseau inconnue lors de la connexion à Supabase."
      }
    };
  }
}

export async function insertCustomerToSupabase(customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<SupabaseResponse<Customer>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase client non configuré." } };
  }
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name: customer.name,
          water_meter: customer.waterMeter,
          electricity_meter: customer.electricityMeter,
          wifi_code: customer.wifiCode,
        },
      ])
      .select();

    if (error) {
      console.error("Erreur d'enregistrement Supabase:", error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    if (!data || data.length === 0) {
      return { data: null, error: { message: "Aucune donnée retournée après l'insertion." } };
    }

    return {
      data: mapDBToCustomer(data[0] as DBTypeCustomer),
      error: null
    };
  } catch (e: any) {
    console.error("Erreur d'insertion réseau Supabase:", e);
    return {
      data: null,
      error: { message: e?.message || "Erreur d'insertion réseau." }
    };
  }
}

export async function updateCustomerInSupabase(
  id: string,
  customer: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<SupabaseResponse<Customer>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: { message: "Supabase client non configuré." } };
  }
  try {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: customer.name,
        water_meter: customer.waterMeter,
        electricity_meter: customer.electricityMeter,
        wifi_code: customer.wifiCode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Erreur de mise à jour Supabase:", error);
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    if (!data || data.length === 0) {
      return { data: null, error: { message: "Aucun abonné n'a été mis à jour dans le cloud." } };
    }

    return {
      data: mapDBToCustomer(data[0] as DBTypeCustomer),
      error: null
    };
  } catch (e: any) {
    console.error("Erreur de modification réseau Supabase:", e);
    return {
      data: null,
      error: { message: e?.message || "Erreur de mise à jour réseau." }
    };
  }
}

export async function deleteCustomerFromSupabase(id: string): Promise<SupabaseResponse<boolean>> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: false, error: { message: "Supabase client non configuré." } };
  }
  try {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      console.error("Erreur de suppression Supabase:", error);
      return {
        data: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }
    return { data: true, error: null };
  } catch (e: any) {
    console.error("Erreur réseau de suppression Supabase:", e);
    return {
      data: false,
      error: { message: e?.message || "Erreur réseau de suppression." }
    };
  }
}
