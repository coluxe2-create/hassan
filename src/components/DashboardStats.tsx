/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User, Droplets, Zap, Wifi } from "lucide-react";
import { Customer } from "../types";

interface StatsProps {
  customers: Customer[];
}

export function DashboardStats({ customers }: StatsProps) {
  const total = customers.length;
  const countWater = customers.filter(c => c.waterMeter && c.waterMeter.trim() !== "").length;
  const countElec = customers.filter(c => c.electricityMeter && c.electricityMeter.trim() !== "").length;
  const countWifi = customers.filter(c => c.wifiCode && c.wifiCode.trim() !== "").length;

  const stats = [
    {
      id: "stat-total-clients",
      title: "Total Clients",
      value: total,
      icon: <User className="w-5 h-5 text-blue-400" id="icon-stat-user" />,
      bg: "bg-blue-950/30 border-blue-800/40",
      textColor: "text-blue-400",
      subtitle: "Enregistrés dans la base",
    },
    {
      id: "stat-total-eau",
      title: "Compteurs d'Eau",
      value: countWater,
      icon: <Droplets className="w-5 h-5 text-cyan-400" id="icon-stat-water" />,
      bg: "bg-cyan-950/30 border-cyan-800/40",
      textColor: "text-cyan-400",
      subtitle: "Affectations actives",
    },
    {
      id: "stat-total-elec",
      title: "Compteurs Électricité",
      value: countElec,
      icon: <Zap className="w-5 h-5 text-amber-400" id="icon-stat-elec" />,
      bg: "bg-amber-950/30 border-amber-800/40",
      textColor: "text-amber-400",
      subtitle: "Raccordements suivis",
    },
    {
      id: "stat-total-wifi",
      title: "Modems Wi-Fi",
      value: countWifi,
      icon: <Wifi className="w-5 h-5 text-indigo-400" id="icon-stat-wifi" />,
      bg: "bg-indigo-950/30 border-indigo-800/40",
      textColor: "text-indigo-400",
      subtitle: "Passerelles configurées",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
      {stats.map((stat) => (
         <div
           key={stat.id}
           id={stat.id}
           className={`p-4 rounded-xl border ${stat.bg} shadow-md transition-all duration-300 hover:scale-[1.01] flex items-center justify-between`}
         >
           <div>
             <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">
               {stat.title}
             </p>
             <h4 id={`value-${stat.id}`} className={`text-3xl font-extrabold font-mono ${stat.textColor}`}>
               {stat.value}
             </h4>
             <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>
           </div>
           <div className="p-3 bg-slate-950 rounded-lg shadow-2xs border border-slate-800">
             {stat.icon}
           </div>
         </div>
      ))}
    </div>
  );
}
