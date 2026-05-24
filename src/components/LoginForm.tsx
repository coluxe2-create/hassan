/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldAlert, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    // Simulate small latency for UX feedback
    setTimeout(() => {
      const cleanInputUser = username.trim().toLowerCase();
      const correctUser = "hassan amchaar";
      const correctPass = "Tesshilat@123";

      if (cleanInputUser === correctUser && password === correctPass) {
        onLoginSuccess();
      } else {
        setError("Identifiants incorrects. Veuillez réessayer.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white" id="login-screen-layout">
      <div className="w-full max-w-md" id="login-card-outer">
        {/* Brand / Title Icon */}
        <div className="text-center mb-8 animate-[fadeIn_0.4s_ease-out]" id="login-title-section">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/20 mb-3" id="login-logo-badge">
            C
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl" id="login-main-header">
            Service Clients
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            Entrez vos identifiants pour accéder à l'administration des compteurs
          </p>
        </div>

        {/* Card panel container */}
        <div 
          className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md animate-[slideUp_0.4s_ease-out]" 
          id="login-form-card"
        >
          <div className="border-b border-slate-800 pb-2">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider block">
              Connexion Sécurisée
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="credentials-login-form">
            {/* Username Input */}
            <div className="space-y-1.5" id="login-group-user">
              <label htmlFor="login-username" className="block text-sm font-semibold text-slate-300">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="login-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="hassan amchaar"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-100 placeholder-slate-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5" id="login-group-pass">
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-300">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 text-base bg-slate-950 border border-slate-800 rounded-xl focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-100 placeholder-slate-600 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-hidden"
                  id="btn-login-toggle-show-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="bg-red-950/40 border border-red-900/40 text-red-300 p-3.5 rounded-xl text-sm flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]" id="login-error-alert">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-75 text-white text-base font-bold rounded-xl transition-all shadow-md shadow-blue-600/15 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer flex items-center justify-center gap-2"
              id="btn-login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Validation en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        </div>

        {/* Tiny footer label */}
        <p className="text-center text-xs text-slate-600 mt-8" id="login-bottom-copyright">
          © 2026 - Service Clients • Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
