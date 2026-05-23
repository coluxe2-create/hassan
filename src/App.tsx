/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  CloudLightning,
  ChevronDown,
  ChevronUp,
  Terminal,
  Shield,
  ExternalLink,
  BookOpen,
  Copy,
  Check
} from "lucide-react";
import { Customer, INITIAL_CUSTOMERS } from "./types";
import { DashboardStats } from "./components/DashboardStats";
import { CustomerForm } from "./components/CustomerForm";
import { CustomerTable } from "./components/CustomerTable";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import {
  fetchCustomersFromSupabase,
  insertCustomerToSupabase,
  updateCustomerInSupabase,
  deleteCustomerFromSupabase,
  SupabaseErrorDetail
} from "./lib/supabaseHelper";

export default function App() {
  const isCloudMode = isSupabaseConfigured();
  const [loading, setLoading] = useState(isCloudMode);
  const [supabaseErrorDetail, setSupabaseErrorDetail] = useState<SupabaseErrorDetail | null>(null);
  
  // Storage source identification
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (!isCloudMode) {
      try {
        const saved = localStorage.getItem("sub_meters_inventory");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Erreur lors de la lecture du localStorage", e);
      }
      return INITIAL_CUSTOMERS;
    }
    return []; // Will load from Supabase asynchronously
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Sync to local storage only if in local offline mode
  useEffect(() => {
    if (!isCloudMode) {
      try {
        localStorage.setItem("sub_meters_inventory", JSON.stringify(customers));
      } catch (e) {
        console.error("Erreur d'écriture dans localStorage", e);
      }
    }
  }, [customers, isCloudMode]);

  // Load from Supabase on start if keys exist
  useEffect(() => {
    let active = true;

    async function loadCloudData() {
      if (!isCloudMode) return;
      setLoading(true);
      setSupabaseErrorDetail(null);
      try {
        const response = await fetchCustomersFromSupabase();
        if (!active) return;
        
        if (response.error === null && response.data !== null) {
          setCustomers(response.data);
          triggerNotification("Données synchronisées en direct depuis Supabase Cloud !", "success");
        } else {
          // If fetch fails, record the error detail
          setSupabaseErrorDetail(response.error);
          
          // Load local storage as secondary backup
          const saved = localStorage.getItem("sub_meters_inventory");
          if (saved) {
            setCustomers(JSON.parse(saved));
          } else {
            setCustomers(INITIAL_CUSTOMERS);
          }
          triggerNotification("Échec de connexion Supabase. Utilisation du stockage local temporaire.", "error");
        }
      } catch (e: any) {
        console.error(e);
        setSupabaseErrorDetail({ message: e?.message || "Erreur de connexion cloud." });
        triggerNotification("Erreur de connexion cloud.", "error");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCloudData();
    return () => {
      active = false;
    };
  }, [isCloudMode]);

  const triggerNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4200);
  };

  const generateId = () => {
    return "cust-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5);
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();

    if (isCloudMode) {
      setLoading(true);
      if (currentCustomer) {
        // Edit in Supabase
        const response = await updateCustomerInSupabase(currentCustomer.id, customerData);
        if (response.error === null && response.data !== null) {
          setCustomers((prev) => prev.map((c) => (c.id === currentCustomer.id ? response.data! : c)));
          triggerNotification(`L'abonné "${customerData.name}" a été mis à jour dans Supabase.`, "success");
          setCurrentCustomer(null);
        } else {
          setSupabaseErrorDetail(response.error);
          triggerNotification(`Erreur lors de la mise à jour sur Supabase: ${response.error?.message}`, "error");
        }
      } else {
        // Insert to Supabase
        const response = await insertCustomerToSupabase(customerData);
        if (response.error === null && response.data !== null) {
          setCustomers((prev) => [response.data!, ...prev]);
          triggerNotification(`L'abonné "${customerData.name}" a été inséré dans Supabase.`, "success");
        } else {
          setSupabaseErrorDetail(response.error);
          triggerNotification(`Erreur d'insertion dans la base Supabase: ${response.error?.message}`, "error");
        }
      }
      setLoading(false);
    } else {
      // Local Storage Mode
      if (currentCustomer) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === currentCustomer.id
              ? {
                  ...c,
                  ...customerData,
                  updatedAt: timestamp,
                }
              : c
          )
        );
        triggerNotification(`Modification de l'abonné "${customerData.name}" enregistrée localement.`, "success");
        setCurrentCustomer(null);
      } else {
        const newCustomer: Customer = {
          id: generateId(),
          ...customerData,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        setCustomers((prev) => [newCustomer, ...prev]);
        triggerNotification(`Abonné "${customerData.name}" ajouté localement (Mode déconnecté).`, "success");
      }
    }
  };

  const handleInitiateEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    document.getElementById("customer-form-container")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteCustomer = async (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;

    if (isCloudMode) {
      setLoading(true);
      const response = await deleteCustomerFromSupabase(id);
      if (response.error === null && response.data === true) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        triggerNotification(`L'abonné "${target.name}" a été supprimé de Supabase Cloud.`, "info");
        if (currentCustomer && currentCustomer.id === id) {
          setCurrentCustomer(null);
        }
      } else {
        setSupabaseErrorDetail(response.error);
        triggerNotification(`Erreur lors de la suppression sur Supabase: ${response.error?.message}`, "error");
      }
      setLoading(false);
    } else {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      triggerNotification(`L'abonné "${target.name}" a été supprimé localement.`, "info");
      if (currentCustomer && currentCustomer.id === id) {
        setCurrentCustomer(null);
      }
    }
  };

  const handleResetDatabase = () => {
    if (isCloudMode) {
      triggerNotification("La réinitialisation globale d'usine est désactivée en mode Cloud Supabase pour éviter les pertes de données secondaires.", "info");
      return;
    }
    if (window.confirm("Voulez-vous restaurer les données par défaut dans le localStorage ?")) {
      setCustomers(INITIAL_CUSTOMERS);
      setCurrentCustomer(null);
      triggerNotification("Localstorage restauré d'usine.", "info");
    }
  };

  const handleSeedSupabase = async () => {
    if (!isCloudMode) return;
    setLoading(true);
    setSupabaseErrorDetail(null);
    let successCount = 0;
    try {
      for (const item of INITIAL_CUSTOMERS) {
        const response = await insertCustomerToSupabase({
          name: item.name,
          waterMeter: item.waterMeter,
          electricityMeter: item.electricityMeter,
          wifiCode: item.wifiCode
        });
        if (response.error === null && response.data !== null) {
          successCount++;
        }
      }
      if (successCount > 0) {
        const reloadRes = await fetchCustomersFromSupabase();
        if (reloadRes.error === null && reloadRes.data !== null) {
          setCustomers(reloadRes.data);
        }
        triggerNotification(`${successCount} abonnés de démo ajoutés avec succès dans Supabase !`, "success");
      } else {
        triggerNotification("Aucun abonné n'a pu être inséré sur Supabase. Vérifiez les erreurs ou la table.", "error");
      }
    } catch (e: any) {
      triggerNotification("Erreur lors de l'injection des données.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(label);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sqlSetupScript = `CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  water_meter TEXT DEFAULT '',
  electricity_meter TEXT DEFAULT '',
  wifi_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS Security Rule (Authorize anyone for this demo setup, or alter as needed)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous full access" ON public.customers FOR ALL USING (true);
`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans leading-relaxed" id="app-root-layout">
      {/* Toast alert system */}
      {notification && (
        <div
          id="global-toast-notification"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-xl shadow-xl border flex items-start gap-3 transition-all transform animate-[slideIn_0.3s_ease-out] bg-white border-slate-200"
          style={{ animation: "slideIn 0.3s ease-out forwards" }}
        >
          {notification.type === "success" && (
            <span className="p-1 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          )}
          {notification.type === "info" && (
            <span className="p-1 bg-blue-105 rounded-lg text-blue-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
          )}
          {notification.type === "error" && (
            <span className="p-1 bg-red-100 rounded-lg text-red-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-900">Notification</p>
            <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Header bar banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30" id="main-site-header">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  GestionCompteurs
                </h1>
                
                {/* Mode badge status */}
                {isCloudMode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CloudLightning className="w-3 h-3 text-emerald-500 animate-pulse" />
                    Supabase Cloud Connecté
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Mode Local Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium font-sans">
                Suivi, édition et recherche des compteurs eau & électricité de clients
              </p>
            </div>
          </div>

          <div id="header-action-button" className="flex items-center">
            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 font-bold" />
              <span>{showConfigGuide ? "Fermer le Guide Vercel/Supabase" : "Déployer sur Vercel & Supabase"}</span>
              {showConfigGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6" id="dashboard-main-content">
        
        {/* Supabase Deployment instructions guide (Collapsible) */}
        {showConfigGuide && (
          <div className="bg-slate-900 text-slate-200 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5 animate-[fadeIn_0.2s_ease-out]" id="integration-guide-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/70 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Guide d'hébergement complet</h3>
                  <p className="text-xs text-slate-400">Pour connecter une vraie base de données Supabase et héberger sur Vercel</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20">Next.js 14 + Vite support</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Étape 1: Créer la table Supabase
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Connectez-vous sur votre tableau de bord <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold inline-flex items-center gap-0.5">Supabase <ExternalLink className="w-3 h-3" /></a>, créez un nouveau projet, puis allez dans l'éditeur de requêtes SQL (SQL Editor) pour exécuter ce script d'initialisation :
                </p>
                
                <div className="relative">
                  <pre className="bg-slate-950 p-3 rounded-lg overflow-x-auto text-[10px] font-mono text-emerald-300 border border-slate-800 select-all max-h-40 leading-relaxed">
                    {sqlSetupScript}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(sqlSetupScript, "sql")}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors border border-slate-705"
                    title="Copier le script SQL"
                  >
                    {copiedSection === "sql" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Étape 2: Déploiement Vercel & Variables
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Liez votre dépôt GitHub de l'application sur <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold inline-flex items-center gap-0.5">Vercel <ExternalLink className="w-3 h-3" /></a>. Lors de la configuration du projet sur Vercel, ajoutez simplement ces variables d'environnement (récupérées dans les paramètres d'API Supabase de votre projet) :
                </p>

                <div className="bg-slate-950 p-4 rounded-xl space-y-3 font-mono text-xs border border-slate-800">
                  <div>
                    <span className="text-slate-500 font-semibold block"># Clés de configuration pour Vercel :</span>
                    <span className="text-cyan-400 block break-all">NEXT_PUBLIC_SUPABASE_URL<span className="text-slate-400">="https://votre-projet.supabase.co"</span></span>
                    <span className="text-cyan-400 block break-all">NEXT_PUBLIC_SUPABASE_ANON_KEY<span className="text-slate-400">="votre-cle-api-publique"</span></span>
                  </div>
                  
                  <div className="border-t border-slate-800/80 pt-2.5">
                    <span className="text-slate-500 font-semibold block"># Ou pour cet émulateur (Secrets de l'IA Studio) :</span>
                    <span className="text-amber-400 block break-all">VITE_SUPABASE_URL<span className="text-slate-300">="..."</span></span>
                    <span className="text-amber-400 block break-all">VITE_SUPABASE_ANON_KEY<span className="text-slate-300">="..."</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p>La clé anonyme de Supabase est publique et peut être exposée sans faille de sécurité grâce aux politiques d'accès RLS.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top summary stats rows */}
        <DashboardStats customers={customers} />

        {/* Diagnostic database panel for Supabase Cloud connection */}
        {isCloudMode && (supabaseErrorDetail || (customers.length === 0 && !loading)) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="supabase-diagnostics-card">
            {supabaseErrorDetail ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-red-700 bg-red-50/70 border border-red-100 p-4 rounded-xl">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-905">Erreur de communication Supabase</h4>
                    <p className="text-xs text-red-650 leading-relaxed">
                      L'application n'a pas pu communiquer correctement avec votre base de données Supabase Cloud.
                    </p>
                    <p className="text-xs font-mono bg-white/60 px-2 py-1.5 rounded border border-red-200/50 text-red-800 break-all mt-1">
                      {supabaseErrorDetail.message || "Erreur de configuration ou d'accès réseau."}
                    </p>
                    {supabaseErrorDetail.hint && (
                      <p className="text-[11px] text-red-600 mt-1">
                        <span className="font-semibold">Indice :</span> {supabaseErrorDetail.hint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sub-Diagnostic: wifi_code column missing */}
                {supabaseErrorDetail.message?.toLowerCase().includes("wifi_code") && (
                  <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-start gap-2 text-amber-800">
                      <Terminal className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Diagnostic: Colonne 'wifi_code' absente</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Il semble que votre table existante <code className="bg-white/80 px-1 py-0.5 rounded font-mono">customers</code> ne soit pas à jour. Exécutez cette ligne dans l'éditeur de requêtes de Supabase pour ajouter le champ Wi-Fi :
                        </p>
                      </div>
                    </div>
                    <div className="relative font-sans">
                      <pre className="bg-slate-900 p-2.5 rounded-lg text-[10px] font-mono text-amber-300 border border-slate-800 select-all overflow-x-auto">
                        ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS wifi_code TEXT DEFAULT '';
                      </pre>
                      <button
                        onClick={() => copyToClipboard("ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS wifi_code TEXT DEFAULT '';", "altcol")}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                        title="Copier le script SQL"
                      >
                        {copiedSection === "altcol" ? <Check className="w-3" /> : <Copy className="w-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Diagnostic: Table customers missing */}
                {(supabaseErrorDetail.message?.toLowerCase().includes("relation") || supabaseErrorDetail.code === "42P01") && (
                  <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl space-y-2">
                    <div className="flex items-start gap-2 text-amber-800">
                      <Terminal className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">Diagnostic: Table 'customers' introuvable</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          La table <code className="bg-white/80 px-1 py-0.5 rounded font-mono">customers</code> n'existe pas encore. Veuillez cliquer sur le bouton <strong>"Déployer sur Vercel & Supabase"</strong> ci-dessus et copier le script d'initialisation complet pour le coller dans Supabase.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setLoading(true);
                      setSupabaseErrorDetail(null);
                      fetchCustomersFromSupabase().then(res => {
                        setLoading(false);
                        if (res.error === null && res.data !== null) {
                          setCustomers(res.data);
                          triggerNotification("Données rechargées avec succès !", "success");
                        } else {
                          setSupabaseErrorDetail(res.error);
                        }
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Réessayer la connexion</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Database is connected but has zero records */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Base Nuage Vide & Active</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Votre base Supabase connectée est actuellement vide. Vous pouvez y injecter automatiquement les données d'exemples d'usine pour commencer directement !
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSeedSupabase}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-600/10 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  Injecter des Abonnés de Démo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic loader line */}
        {loading && (
          <div className="w-full h-1 bg-blue-100 overflow-hidden rounded-full relative" id="table-loading-bar">
            <div className="absolute inset-y-0 left-0 bg-blue-600 w-1/3 rounded-full animate-[progress_1.4s_infinite_ease-in-out]" style={{ animation: "progress 1.4s infinite ease-in-out" }}></div>
          </div>
        )}

        {/* Searching Filtering tools block */}
        <section className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4" id="filters-panel">
          <div className="w-full sm:w-96 relative" id="search-input-field">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom de client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-1.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              id="customer-search-textbox"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                id="btn-clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs font-semibold text-slate-500">
            <span>
              {searchQuery ? (
                <>
                  Abonnés trouvés : <span className="text-slate-900 font-bold">{filteredCustomers.length}</span> sur {customers.length}
                </>
              ) : (
                <>
                  Total abonnés : <span className="text-slate-900 font-bold">{customers.length}</span>
                </>
              )}
            </span>
          </div>
        </section>

        {/* Main application UI Grid splitter */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" id="split-layout-grid2">
          {/* Customer registry Form column */}
          <div className="lg:col-span-1 space-y-4" id="left-form-sidebar">
            <CustomerForm
              currentCustomer={currentCustomer}
              onSave={handleSaveCustomer}
              onCancelEdit={() => setCurrentCustomer(null)}
            />

            {/* Offline backup card */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 space-y-2" id="persistance-disclaimer-panel">
              <span className="font-bold text-blue-900 uppercase tracking-wide text-[10px] block">
                {isCloudMode ? "Source Nuage Active (Supabase)" : "Mode Local Activé"}
              </span>
              <p className="leading-relaxed">
                {isCloudMode
                  ? "Les entrées sont sauvegardées en temps réel sur votre base de données Supabase."
                  : "Les informations sont actuellement conservées dans la mémoire locale de votre navigateur."}
              </p>
              {!isCloudMode && (
                <div className="pt-2 flex items-center justify-between border-t border-blue-200/30">
                  <span className="text-[10px] text-slate-500">Données démo d'usine :</span>
                  <button
                    type="button"
                    onClick={handleResetDatabase}
                    className="text-[10px] font-bold text-red-650 hover:text-red-700 transition-colors uppercase tracking-wider cursor-pointer"
                    id="btn-hard-reset-data"
                  >
                    Restaurer Démo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Lists view column */}
          <div className="lg:col-span-2" id="right-table-body">
            <CustomerTable
              customers={filteredCustomers}
              searchQuery={searchQuery}
              onEdit={handleInitiateEdit}
              onDelete={handleDeleteCustomer}
            />
          </div>
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-400 py-10 border-t border-slate-200" id="main-site-footer">
        <p>© 2026 - Gestion Clients, Compteurs d'Eau, Électricité & Codes Wi-Fi</p>
        <p className="mt-1 text-[10px]">
          Prêt pour déploiement sur Vercel avec persistance de données en temps réel Supabase
        </p>
      </footer>
    </div>
  );
}
