/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Edit, Trash2, Copy, Check, Droplets, Zap, Wifi, User, SearchX, AlertTriangle } from "lucide-react";
import { Customer } from "../types";

interface CustomerTableProps {
  customers: Customer[];
  searchQuery: string;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export function CustomerTable({ customers, searchQuery, onEdit, onDelete }: CustomerTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Clipboard copy handler
  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  // Helper helper to highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const cleanQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Regex escape
    const regex = new RegExp(`(${cleanQuery})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-blue-500/30 text-blue-300 font-bold px-0.5 rounded-[2px]">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Format date readable
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (customers.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[300px]" id="no-customers-view">
        <div className="p-4 bg-slate-950 rounded-full border border-slate-800 mb-3">
          <SearchX className="w-8 h-8 text-slate-550" />
        </div>
        <p className="text-base font-bold text-slate-200">Aucun abonné trouvé</p>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          {searchQuery
            ? "Aucun résultat ne correspond à votre recherche. Essayez un autre nom."
            : "La base de données est vide. Renseignez le formulaire à gauche pour enregistrer un client."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-colors" id="customer-table-container">
      {/* Mobile view cards - hidden on md+ screens */}
      <div className="block md:hidden divide-y divide-slate-800" id="customer-mobile-list">
        {customers.map((customer) => {
          const isWaterAvailable = !!customer.waterMeter;
          const isElecAvailable = !!customer.electricityMeter;
          const isWifiAvailable = !!customer.wifiCode;
          const wifiKey = `${customer.id}-wifi`;
          const waterKey = `${customer.id}-water`;
          const elecKey = `${customer.id}-elec`;

          return (
            <div key={customer.id} id={`mobile-card-${customer.id}`} className="p-4.5 space-y-3 bg-slate-900/40 hover:bg-slate-850/30 transition-colors">
              {/* Header inside card */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-base">
                    {highlightText(customer.name, searchQuery)}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Modifié le {formatDate(customer.updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {deleteConfirmId === customer.id ? (
                    <div className="flex items-center gap-1.5" id={`confirm-actions-mobile-${customer.id}`}>
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="p-1.5 bg-red-650 text-white rounded-lg hover:bg-red-750 text-xs uppercase font-bold tracking-wider"
                        title="Confirmer la suppression"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-750 text-xs uppercase font-bold px-2"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-2 bg-slate-950 text-blue-400 border border-slate-850 rounded-lg hover:bg-slate-900 transition-colors"
                        title="Modifier le client"
                        id={`btn-edit-mobile-${customer.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(customer.id)}
                        className="p-2 bg-slate-950 text-red-400 border border-slate-850 rounded-lg hover:bg-slate-900 transition-colors"
                        title="Supprimer le client"
                        id={`btn-delete-mobile-${customer.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Badges and data block */}
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {/* Water meter info row */}
                <div className="flex items-center justify-between text-sm bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Eau:</span>
                  </div>
                  {isWaterAvailable ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                        {customer.waterMeter}
                      </span>
                      <button
                        onClick={() => copyToClipboard(customer.waterMeter, waterKey)}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Copier"
                      >
                        {copiedKey === waterKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Non configuré</span>
                  )}
                </div>

                {/* Elec meter info row */}
                <div className="flex items-center justify-between text-sm bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Électricité:</span>
                  </div>
                  {isElecAvailable ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                        {customer.electricityMeter}
                      </span>
                      <button
                        onClick={() => copyToClipboard(customer.electricityMeter, elecKey)}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Copier"
                      >
                        {copiedKey === elecKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Non configuré</span>
                  )}
                </div>

                {/* Wifi info row */}
                <div className="flex items-center justify-between text-sm bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Wifi className="w-4 h-4 text-indigo-400" />
                    <span>Wi-Fi:</span>
                  </div>
                  {isWifiAvailable ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                        {customer.wifiCode}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(customer.wifiCode, wifiKey)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Copier"
                        >
                          {copiedKey === wifiKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Non configuré</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view table - hidden on mobile / small screens */}
      <div className="hidden md:block overflow-x-auto" id="customer-desktop-table">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="px-5 py-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">Client</th>
              <th className="px-5 py-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  Compteur Eau
                </div>
              </th>
              <th className="px-5 py-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Compteur Électricité
                </div>
              </th>
              <th className="px-5 py-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  Réseau & Code Wi-Fi
                </div>
              </th>
              <th className="px-5 py-4 text-sm font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {customers.map((customer) => {
              const wifiKey = `${customer.id}-wifi`;
              const waterKey = `${customer.id}-water`;
              const elecKey = `${customer.id}-elec`;

              return (
                <tr key={customer.id} id={`row-customer-${customer.id}`} className="hover:bg-slate-850/40 border-b border-slate-800/60 transition-colors align-middle text-slate-200">
                  {/* Name field */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-4.5 h-4.5 text-slate-400" id={`user-avatar-icon-${customer.id}`} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-100 leading-normal">
                          {highlightText(customer.name, searchQuery)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          Modifié le {formatDate(customer.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Water meter */}
                  <td className="px-5 py-4">
                    {customer.waterMeter ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                          {customer.waterMeter}
                        </span>
                        <button
                          onClick={() => copyToClipboard(customer.waterMeter, waterKey)}
                          className="p-1 px-1.5 text-slate-450 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Copier le compteur d'eau"
                          id={`btn-copy-water-${customer.id}`}
                        >
                          {copiedKey === waterKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Non spécifié</span>
                    )}
                  </td>

                  {/* Elec meter */}
                  <td className="px-5 py-4">
                    {customer.electricityMeter ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                          {customer.electricityMeter}
                        </span>
                        <button
                          onClick={() => copyToClipboard(customer.electricityMeter, elecKey)}
                          className="p-1 px-1.5 text-slate-450 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Copier le compteur d'électricité"
                          id={`btn-copy-elec-${customer.id}`}
                        >
                          {copiedKey === elecKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Non spécifié</span>
                    )}
                  </td>

                  {/* Wi-Fi keys */}
                  <td className="px-5 py-4">
                    {customer.wifiCode ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-slate-200 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                          {customer.wifiCode}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => copyToClipboard(customer.wifiCode, wifiKey)}
                            className="p-1 text-slate-450 hover:text-blue-400 transition-colors cursor-pointer"
                            title="Copier le mot de passe Wi-Fi"
                            id={`btn-copy-wifi-${customer.id}`}
                          >
                            {copiedKey === wifiKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Non configuré</span>
                    )}
                  </td>

                  {/* Responsive triggers */}
                  <td className="px-5 py-4 text-right">
                    {deleteConfirmId === customer.id ? (
                      <div className="flex items-center justify-end gap-1.5" id={`confirm-actions-row-${customer.id}`}>
                        <span className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> Sûr ?
                        </span>
                        <button
                          onClick={() => {
                            onDelete(customer.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer shadow-sm"
                          id={`btn-confirm-delete-row-${customer.id}`}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-755 text-slate-200 rounded-lg text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer"
                          id={`btn-cancel-delete-row-${customer.id}`}
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5" id={`default-row-actions-${customer.id}`}>
                        <button
                          onClick={() => onEdit(customer)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                          title="Modifier l'abonné"
                          id={`btn-edit-row-${customer.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(customer.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                          title="Supprimer définitivement"
                          id={`btn-delete-row-${customer.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
