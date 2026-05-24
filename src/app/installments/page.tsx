"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, calculateInstallment } from "@/lib/utils";
import { INSTALLMENT_CONFIGS } from "@/types";
import { CreditCard, Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function InstallmentsPage() {
  const [amount, setAmount] = useState("100000");

  const calculations = INSTALLMENT_CONFIGS.map((cfg) => {
    if (cfg.installments === 1) {
      return { ...cfg, monthly: parseFloat(amount) || 0, totalWithInterest: parseFloat(amount) || 0, totalInterest: 0 };
    }
    const calc = calculateInstallment(parseFloat(amount) || 0, cfg.installments, cfg.interestRate);
    return { ...cfg, ...calc };
  });

  return (
    <AppLayout title="Simulador de Cuotas">
      <div className="space-y-5 animate-fade-in">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              Simulador de Cuotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <label className="text-sm text-gray-500">Monto del producto (ARS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 text-xl font-bold"
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {calculations.map((cfg, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition-all ${
                    i === 0
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-800">{cfg.label}</span>
                    {cfg.interestRate > 0 ? (
                      <Badge variant="warning">+{cfg.interestRate}%</Badge>
                    ) : (
                      <Badge variant="success">Sin interés</Badge>
                    )}
                  </div>

                  {cfg.installments === 1 ? (
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(cfg.monthly)}</p>
                      <p className="text-xs text-gray-400 mt-1">Pago único</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400">{cfg.installments} cuotas de</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(cfg.monthly)}</p>
                      <Separator className="my-2" />
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Total con interés:</span>
                          <span className="font-medium text-gray-700">{formatCurrency(cfg.totalWithInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Costo financiero:</span>
                          <span className="text-red-500 font-medium">{formatCurrency(cfg.totalInterest)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800 mb-1">Sobre las cuotas</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Las tasas de interés son configurables. Los costos financieros se calculan automáticamente al crear una venta con plan de cuotas. 
                  El sistema registra cada cuota individualmente y permite hacer seguimiento de los pagos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
