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
      icon: <User className="w-5 h-5 text-blue-600" id="icon-stat-user" />,
      bg: "bg-blue-50 border-blue-100",
      textColor: "text-blue-900",
      subtitle: "Enregistrés localement",
    },
    {
      id: "stat-total-eau",
      title: "Compteurs d'Eau",
      value: countWater,
      icon: <Droplets className="w-5 h-5 text-cyan-600" id="icon-stat-water" />,
      bg: "bg-cyan-50 border-cyan-100",
      textColor: "text-cyan-900",
      subtitle: "Affectations actives",
    },
    {
      id: "stat-total-elec",
      title: "Compteurs Électricité",
      value: countElec,
      icon: <Zap className="w-5 h-5 text-amber-500" id="icon-stat-elec" />,
      bg: "bg-amber-50 border-amber-100",
      textColor: "text-amber-900",
      subtitle: "Raccordements suivis",
    },
    {
      id: "stat-total-wifi",
      title: "Modems Wi-Fi",
      value: countWifi,
      icon: <Wifi className="w-5 h-5 text-indigo-600" id="icon-stat-wifi" />,
      bg: "bg-indigo-50 border-indigo-100",
      textColor: "text-indigo-900",
      subtitle: "Passerelles configurées",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
      {stats.map((stat) => (
        <div
          key={stat.id}
          id={stat.id}
          className={`p-4 rounded-xl border ${stat.bg} shadow-xs transition-all duration-300 hover:shadow-md flex items-center justify-between`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {stat.title}
            </p>
            <h4 id={`value-${stat.id}`} className={`text-2xl font-bold font-mono ${stat.textColor}`}>
              {stat.value}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{stat.subtitle}</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-2xs border border-slate-105">
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
