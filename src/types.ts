/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  name: string;
  waterMeter: string;
  electricityMeter: string;
  wifiCode: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Jean-Marc Dubois",
    waterMeter: "W-8849-01",
    electricityMeter: "E-99382-A",
    wifiCode: "MarocTelecom_A883_F3",
    createdAt: "2026-05-10T10:30:00Z",
    updatedAt: "2026-05-12T14:20:00Z",
  },
  {
    id: "cust-2",
    name: "Amira Benjelloun",
    waterMeter: "W-3209-44",
    electricityMeter: "E-48192-B",
    wifiCode: "FiberHome_Benjelloun_5G",
    createdAt: "2026-05-15T09:15:00Z",
    updatedAt: "2026-05-15T09:15:00Z",
  },
  {
    id: "cust-3",
    name: "Hassan Mouline (Villa 12)",
    waterMeter: "W-5541-12",
    electricityMeter: "E-10294-F",
    wifiCode: "Orange_Sagem_12F982",
    createdAt: "2026-05-18T16:45:00Z",
    updatedAt: "2026-05-20T11:05:00Z",
  },
];
