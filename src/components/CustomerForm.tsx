/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Droplets, Zap, Wifi, PlusCircle, Save, XCircle } from "lucide-react";
import { Customer } from "../types";

interface CustomerFormProps {
  currentCustomer: Customer | null; // If null, we are in ADD mode; else EDIT mode
  onSave: (customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">) => void;
  onCancelEdit: () => void;
}

export function CustomerForm({ currentCustomer, onSave, onCancelEdit }: CustomerFormProps) {
  const [name, setName] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [electricityMeter, setElectricityMeter] = useState("");
  const [wifiCode, setWifiCode] = useState("");
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({});

  // Sync state with current edit customer if set
  useEffect(() => {
    if (currentCustomer) {
      setName(currentCustomer.name);
      setWaterMeter(currentCustomer.waterMeter);
      setElectricityMeter(currentCustomer.electricityMeter);
      setWifiCode(currentCustomer.wifiCode);
      setErrors({});
    } else {
      // Reset when not editing
      setName("");
      setWaterMeter("");
      setElectricityMeter("");
      setWifiCode("");
      setErrors({});
    }
  }, [currentCustomer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; general?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Le nom du client est obligatoire.";
    }

    if (!waterMeter.trim() && !electricityMeter.trim() && !wifiCode.trim()) {
      newErrors.general = "Saisissez au moins un numéro (Eau, Électricité ou Wi-Fi).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      waterMeter: waterMeter.trim(),
      electricityMeter: electricityMeter.trim(),
      wifiCode: wifiCode.trim(),
    });

    // Reset fields if in ADD mode (if EDIT mode, the parent handles state changes)
    if (!currentCustomer) {
      setName("");
      setWaterMeter("");
      setElectricityMeter("");
      setWifiCode("");
      setErrors({});
    }
  };

  const handleClear = () => {
    if (currentCustomer) {
      onCancelEdit();
    } else {
      setName("");
      setWaterMeter("");
      setElectricityMeter("");
      setWifiCode("");
      setErrors({});
    }
  };

  const isEditMode = !!currentCustomer;

  return (
    <div
      id="customer-form-container"
      className={`bg-white rounded-2xl border transition-all duration-300 ${
        isEditMode ? "border-blue-500 ring-2 ring-blue-500/10 shadow-lg" : "border-slate-200 shadow-xs"
      } overflow-hidden`}
    >
      {/* Container Header */}
      <div
        id="form-header"
        className={`px-5 py-4 flex items-center justify-between border-b ${
          isEditMode ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 border-slate-100 text-slate-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <Save className="w-5 h-5 animate-pulse" id="form-header-icon-edit" />
          ) : (
            <PlusCircle className="w-5 h-5 text-blue-600" id="form-header-icon-add" />
          )}
          <h3 className="font-semibold text-sm tracking-wide">
            {isEditMode ? "Modifier l'Abonné" : "Ajouter un nouvel Abonné"}
          </h3>
        </div>
        {isEditMode && (
          <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-700/80 text-white px-2 py-0.5 rounded-full">
            Édition ACTIVE
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4" id="customer-registration-form">
        {/* Client Name */}
        <div id="form-group-name" className="space-y-1">
          <label htmlFor="customer-name-input" className="block text-xs font-semibold text-slate-600">
            Nom complet de l'abonné <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              id="customer-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Ex: Ahmed El Mansouri / SARL Global Tech"
              className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-lg border focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                errors.name ? "border-red-300 ring-2 ring-red-500/10 focus:border-red-500" : "border-slate-200"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] font-medium text-red-500" id="error-name">
              {errors.name}
            </p>
          )}
        </div>

        {/* Separator line for identifiers */}
        <div className="relative py-1 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Compteurs & Wi-Fi
          </span>
        </div>

        {/* Water Meter */}
        <div id="form-group-water" className="space-y-1">
          <label htmlFor="water-meter-input" className="block text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-cyan-500" />
            Numéro de Compteur d'Eau
          </label>
          <input
            type="text"
            id="water-meter-input"
            value={waterMeter}
            onChange={(e) => {
              setWaterMeter(e.target.value);
              if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
            }}
            placeholder="Ex: W-6603-91"
            className="w-full px-3 py-1.5 text-sm bg-slate-50 font-mono rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Electricity Meter */}
        <div id="form-group-elec" className="space-y-1">
          <label htmlFor="elec-meter-input" className="block text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Numéro de Compteur d'Électricité
          </label>
          <input
            type="text"
            id="elec-meter-input"
            value={electricityMeter}
            onChange={(e) => {
              setElectricityMeter(e.target.value);
              if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
            }}
            placeholder="Ex: E-99411-B"
            className="w-full px-3 py-1.5 text-sm bg-slate-50 font-mono rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Wi-Fi Code */}
        <div id="form-group-wifi" className="space-y-1">
          <label htmlFor="wifi-code-input" className="block text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-indigo-500" />
            Clé / Code de connexion Wi-Fi
          </label>
          <input
            type="text"
            id="wifi-code-input"
            value={wifiCode}
            onChange={(e) => {
              setWifiCode(e.target.value);
              if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
            }}
            placeholder="Ex: Wi-Fi_Privé_Pass123"
            className="w-full px-3 py-1.5 text-sm bg-slate-50 font-mono rounded-lg border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* General empty fields Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2" id="error-general-alert">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p>{errors.general}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex gap-2" id="form-action-buttons">
          <button
            type="button"
            onClick={handleClear}
            className="w-1/2 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            id="btn-form-clear-or-cancel"
          >
            {isEditMode ? "Annuler" : "Effacer"}
          </button>
          <button
            type="submit"
            className={`w-1/2 py-2 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              isEditMode ? "bg-blue-600" : "bg-emerald-600"
            }`}
            id="btn-form-submit"
          >
            {isEditMode ? (
              <>
                <Save className="w-3.5 h-3.5 animate-pulse" />
                Sauvegarder
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5" />
                Valider
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
