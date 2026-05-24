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
  CloudLightning,
  Terminal,
  Copy,
  Check,
  LogOut
} from "lucide-react";
import { Customer, INITIAL_CUSTOMERS } from "./types";
import { DashboardStats } from "./components/DashboardStats";
import { CustomerForm } from "./components/CustomerForm";
import { CustomerTable } from "./components/CustomerTable";
import { LoginForm } from "./components/LoginForm";
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("admin_logged_in") === "true");
  
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

  if (!isLoggedIn) {
    return (
      <LoginForm
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          localStorage.setItem("admin_logged_in", "true");
        }}
      />
    );
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("admin_logged_in");
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans leading-relaxed selection:bg-blue-600/30 font-medium" id="app-root-layout">
      {/* Toast alert system */}
      {notification && (
        <div
          id="global-toast-notification"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all transform animate-[slideIn_0.3s_ease-out] bg-slate-900 border-slate-800"
          style={{ animation: "slideIn 0.3s ease-out forwards" }}
        >
          {notification.type === "success" && (
            <span className="p-1 bg-emerald-950/60 rounded-lg text-emerald-400 shrink-0 border border-emerald-900/40">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          )}
          {notification.type === "info" && (
            <span className="p-1 bg-blue-950/60 rounded-lg text-blue-400 shrink-0 border border-blue-900/40">
              <Sparkles className="w-5 h-5" />
            </span>
          )}
          {notification.type === "error" && (
            <span className="p-1 bg-red-950/60 rounded-lg text-red-400 shrink-0 border border-red-900/40">
              <AlertCircle className="w-5 h-5" />
            </span>
          )}
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-200">Notification</p>
            <p className="text-xs text-slate-400 mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-850 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-slate-450" />
          </button>
        </div>
      )}

      {/* Header bar banner */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md" id="main-site-header">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20 shrink-0">
              S
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Service Clients
                </h1>
                
                {/* Mode badge status */}
                {isCloudMode ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2.5 py-0.5 rounded-full">
                    <CloudLightning className="w-3 h-3 text-emerald-500 animate-pulse" />
                    Supabase Cloud Connecté
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-950/40 text-blue-400 border border-blue-900/40 px-2.5 py-0.5 rounded-full">
                    Mode Local Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium font-sans mt-0.5">
                Suivi, édition et recherche des compteurs eau & électricité de clients
              </p>
            </div>
          </div>

          {/* Action on Header rightside */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
              id="btn-app-logout"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6" id="dashboard-main-content">
        
        {/* Top summary stats rows */}
        <DashboardStats customers={customers} />

        {/* Diagnostic database panel for Supabase Cloud connection */}
        {isCloudMode && supabaseErrorDetail && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4" id="supabase-diagnostics-card">
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
                        La table <code className="bg-white/80 px-1 py-0.5 rounded font-mono">customers</code> n'existe pas encore. Veuillez vous assurer d'exécuter le script SQL pour l'initialisation de la table dans votre projet Supabase.
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
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-slate-250 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-805"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Réessayer la connexion</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic loader line */}
        {loading && (
          <div className="w-full h-1 bg-slate-950 overflow-hidden rounded-full relative" id="table-loading-bar">
            <div className="absolute inset-y-0 left-0 bg-blue-500 w-1/3 rounded-full animate-[progress_1.4s_infinite_ease-in-out]" style={{ animation: "progress 1.4s infinite ease-in-out" }}></div>
          </div>
        )}

        {/* Main application UI Layout - Centered form above table */}
        <section className="space-y-8" id="layout-content-wrapper">
          {/* Centered Customer registry Form wrapper */}
          <div className="flex justify-center w-full" id="centered-form-wrapper">
            <div className="w-full max-w-2xl space-y-4" id="form-inner-container">
              <CustomerForm
                currentCustomer={currentCustomer}
                onSave={handleSaveCustomer}
                onCancelEdit={() => setCurrentCustomer(null)}
              />

              {/* Offline backup card */}
              <div className="bg-blue-950/10 border border-blue-900/30 rounded-xl p-4.5 text-xs text-slate-300 space-y-2 animate-[fadeIn_0.3s_ease-out]" id="persistance-disclaimer-panel">
                <span className="font-bold text-blue-400 uppercase tracking-widest text-[11px] block">
                  {isCloudMode ? "Source Nuage Active (Supabase)" : "Mode Local Activé"}
                </span>
                <p className="leading-relaxed text-slate-400">
                  {isCloudMode
                    ? "Les entrées sont sauvegardées en temps réel sur votre base de données Supabase."
                    : "Les informations sont actuellement conservées dans la mémoire locale de votre navigateur."}
                </p>
                {!isCloudMode && (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <span className="text-[11px] text-slate-500 font-medium">Données démo d'usine :</span>
                    <button
                      type="button"
                      onClick={handleResetDatabase}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider cursor-pointer"
                      id="btn-hard-reset-data"
                    >
                      Restaurer Démo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Searching Filtering tools block */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 mx-auto w-full" id="filters-panel">
            <div className="w-full sm:w-96 relative" id="search-input-field">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher par nom de client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder-slate-650 transition-all font-medium text-base"
                id="customer-search-textbox"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-550 hover:text-slate-300 cursor-pointer"
                  id="btn-clear-search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-sm font-semibold text-slate-400 bg-slate-950/40 px-4 py-2 rounded-xl border border-slate-800/40">
              <span>
                {searchQuery ? (
                  <>
                    Abonnés trouvés : <span className="text-slate-100 font-extrabold text-base">{filteredCustomers.length}</span> sur {customers.length}
                  </>
                ) : (
                  <>
                    Total abonnés : <span className="text-slate-100 font-extrabold text-base">{customers.length}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Customer Lists view block */}
          <div className="w-full" id="full-width-table-body">
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
      <footer className="text-center text-sm text-slate-500 py-10 border-t border-slate-850" id="main-site-footer">
        <p>© 2026 - Service Clients. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
