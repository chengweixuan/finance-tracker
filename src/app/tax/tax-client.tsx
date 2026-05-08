"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2, Save } from "lucide-react";

const TAX_BRACKETS = [
  { min: 0, max: 20000, rate: 0 },
  { min: 20000, max: 30000, rate: 0.02 },
  { min: 30000, max: 40000, rate: 0.035 },
  { min: 40000, max: 80000, rate: 0.07 },
  { min: 80000, max: 120000, rate: 0.115 },
  { min: 120000, max: 160000, rate: 0.15 },
  { min: 160000, max: 200000, rate: 0.18 },
  { min: 200000, max: 240000, rate: 0.19 },
  { min: 240000, max: 280000, rate: 0.195 },
  { min: 280000, max: 320000, rate: 0.20 },
  { min: 320000, max: 500000, rate: 0.22 },
  { min: 500000, max: Infinity, rate: 0.23 },
];

interface Relief {
  id: string;
  label: string;
  amount: number;
  enabled: boolean;
  editable: boolean;
  max?: number;
}

const DEFAULT_RELIEFS: Relief[] = [
  { id: "earned_income", label: "Earned Income Relief (age <55)", amount: 1000, enabled: true, editable: false },
  { id: "cpf", label: "CPF Relief", amount: 0, enabled: false, editable: true, max: 20400 },
  { id: "nsman_active", label: "NSman Relief (Active)", amount: 3000, enabled: false, editable: false },
  { id: "nsman_non_active", label: "NSman Relief (Non-Active)", amount: 1500, enabled: false, editable: false },
  { id: "spouse", label: "Spouse Relief", amount: 2000, enabled: false, editable: false },
  { id: "child", label: "Qualifying Child Relief", amount: 4000, enabled: false, editable: true },
  { id: "parent_same", label: "Parent Relief (same household)", amount: 9000, enabled: false, editable: true },
  { id: "parent_diff", label: "Parent Relief (different household)", amount: 5500, enabled: false, editable: true },
  { id: "course_fees", label: "Course Fees Relief", amount: 0, enabled: false, editable: true, max: 5500 },
  { id: "srs", label: "SRS Relief", amount: 0, enabled: false, editable: true, max: 15300 },
  { id: "donations", label: "Donations (2.5x deduction)", amount: 0, enabled: false, editable: true },
];

function calculateTax(chargeableIncome: number) {
  const breakdown: { bracket: string; income: number; rate: number; tax: number }[] = [];
  let remaining = Math.max(chargeableIncome, 0);
  let totalTax = 0;

  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    const tax = taxableInBracket * bracket.rate;
    totalTax += tax;

    if (taxableInBracket > 0) {
      const label = bracket.max === Infinity
        ? `Above ${formatCurrency(bracket.min, "SGD")}`
        : `${formatCurrency(bracket.min, "SGD")} – ${formatCurrency(bracket.max, "SGD")}`;
      breakdown.push({ bracket: label, income: taxableInBracket, rate: bracket.rate, tax });
    }

    remaining -= taxableInBracket;
  }

  return { totalTax, breakdown };
}

interface InitialData {
  income: number;
  monthlyMode: boolean;
  reliefs: { id: string; enabled: boolean; amount: number }[];
  customReliefs: { label: string; amount: number }[];
}

function applyInitialReliefs(saved: { id: string; enabled: boolean; amount: number }[]): Relief[] {
  return DEFAULT_RELIEFS.map((r) => {
    const match = saved.find((s) => s.id === r.id);
    if (match) return { ...r, enabled: match.enabled, amount: match.amount };
    return r;
  });
}

export function TaxClient({ initialData }: { initialData: InitialData | null }) {
  const [annualIncome, setAnnualIncome] = useState(initialData?.income?.toString() ?? "");
  const [monthlyMode, setMonthlyMode] = useState(initialData?.monthlyMode ?? false);
  const [reliefs, setReliefs] = useState<Relief[]>(
    initialData?.reliefs ? applyInitialReliefs(initialData.reliefs) : DEFAULT_RELIEFS
  );
  const [customReliefs, setCustomReliefs] = useState<{ label: string; amount: number }[]>(
    initialData?.customReliefs ?? []
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const income = parseFloat(annualIncome) || 0;
  const effectiveIncome = monthlyMode ? income * 12 : income;

  const totalReliefs = reliefs
    .filter((r) => r.enabled)
    .reduce((s, r) => {
      if (r.id === "donations") return s + r.amount * 2.5;
      return s + r.amount;
    }, 0) + customReliefs.reduce((s, r) => s + r.amount, 0);

  const chargeableIncome = Math.max(effectiveIncome - totalReliefs, 0);
  const { totalTax, breakdown } = calculateTax(chargeableIncome);
  const effectiveRate = effectiveIncome > 0 ? (totalTax / effectiveIncome) * 100 : 0;

  function toggleRelief(id: string) {
    setReliefs(reliefs.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setDirty(true);
  }

  function updateReliefAmount(id: string, value: string) {
    setReliefs(reliefs.map((r) => {
      if (r.id !== id) return r;
      let amount = parseFloat(value) || 0;
      if (r.max) amount = Math.min(amount, r.max);
      return { ...r, amount };
    }));
    setDirty(true);
  }

  function addCustomRelief() {
    setCustomReliefs([...customReliefs, { label: "", amount: 0 }]);
    setDirty(true);
  }

  function removeCustomRelief(index: number) {
    setCustomReliefs(customReliefs.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/tax", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        income: parseFloat(annualIncome) || 0,
        monthlyMode,
        reliefs: reliefs.map((r) => ({ id: r.id, enabled: r.enabled, amount: r.amount })),
        customReliefs: customReliefs.filter((r) => r.label.trim()),
      }),
    });
    setSaving(false);
    setDirty(false);
  }

  function updateCustomRelief(index: number, field: "label" | "amount", value: string) {
    const updated = [...customReliefs];
    if (field === "amount") {
      updated[index] = { ...updated[index], amount: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], label: value };
    }
    setCustomReliefs(updated);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Taxable Income</CardTitle>
            <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Label className="flex items-center gap-2 cursor-pointer text-sm">
                <button
                  type="button"
                  role="switch"
                  aria-checked={monthlyMode}
                  onClick={() => { setMonthlyMode(!monthlyMode); setDirty(true); }}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${monthlyMode ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${monthlyMode ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                {monthlyMode ? "Monthly salary" : "Annual income"}
              </Label>
            </div>
            <div>
              <Label htmlFor="income">{monthlyMode ? "Monthly Salary (SGD)" : "Annual Taxable Income (SGD)"}</Label>
              <Input
                id="income"
                type="number"
                step="0.01"
                min="0"
                value={annualIncome}
                onChange={(e) => { setAnnualIncome(e.target.value); setDirty(true); }}
                className="mt-1 text-lg font-mono"
                placeholder={monthlyMode ? "e.g. 8000" : "e.g. 96000"}
              />
              {monthlyMode && income > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Annual: {formatCurrency(income * 12, "SGD")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxable Income</span>
              <span className="font-mono">{formatCurrency(effectiveIncome, "SGD")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Reliefs</span>
              <span className="font-mono text-emerald-600">-{formatCurrency(totalReliefs, "SGD")}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Chargeable Income</span>
              <span className="font-mono font-medium">{formatCurrency(chargeableIncome, "SGD")}</span>
            </div>
            <div className="flex justify-between text-lg border-t pt-3 font-bold">
              <span>Tax Payable</span>
              <span className="text-red-600">{formatCurrency(totalTax, "SGD")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Effective Tax Rate</span>
              <span className="font-mono">{effectiveRate.toFixed(2)}%</span>
            </div>
            {effectiveIncome > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Tax</span>
                <span className="font-mono">{formatCurrency(totalTax / 12, "SGD")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tax Reliefs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reliefs.map((relief) => (
                <div key={relief.id} className="flex items-center gap-3 py-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={relief.enabled}
                    onClick={() => toggleRelief(relief.id)}
                    className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors ${relief.enabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-background shadow-sm transition-transform ${relief.enabled ? "translate-x-3" : "translate-x-0"}`} />
                  </button>
                  <span className={`text-sm flex-1 ${relief.enabled ? "" : "text-muted-foreground"}`}>
                    {relief.label}
                  </span>
                  {relief.editable && relief.enabled ? (
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max={relief.max}
                      value={relief.amount || ""}
                      onChange={(e) => updateReliefAmount(relief.id, e.target.value)}
                      className="h-7 w-28 text-xs font-mono text-right"
                    />
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground w-28 text-right">
                      {relief.enabled ? formatCurrency(relief.id === "donations" ? relief.amount * 2.5 : relief.amount, "SGD") : "—"}
                    </span>
                  )}
                </div>
              ))}
              {customReliefs.map((cr, i) => (
                <div key={`custom-${i}`} className="flex items-center gap-2 py-1">
                  <Badge variant="outline" className="text-[10px]">Custom</Badge>
                  <Input
                    placeholder="Relief name"
                    value={cr.label}
                    onChange={(e) => updateCustomRelief(i, "label", e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={cr.amount || ""}
                    onChange={(e) => updateCustomRelief(i, "amount", e.target.value)}
                    className="h-7 w-28 text-xs font-mono text-right"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCustomRelief(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-2" onClick={addCustomRelief}>
                <Plus className="h-3.5 w-3.5 mr-2" /> Add Custom Relief
              </Button>
            </div>
            <div className="flex justify-between text-sm font-medium border-t mt-3 pt-3">
              <span>Total Reliefs</span>
              <span className="font-mono">{formatCurrency(totalReliefs, "SGD")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Breakdown by Bracket</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Enter your income to see the breakdown.
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Bracket</th>
                      <th className="text-right p-2 font-medium">Rate</th>
                      <th className="text-right p-2 font-medium">Income</th>
                      <th className="text-right p-2 font-medium">Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((b, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 text-xs">{b.bracket}</td>
                        <td className="p-2 text-right font-mono text-xs">{(b.rate * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right font-mono text-xs">{formatCurrency(b.income, "SGD")}</td>
                        <td className="p-2 text-right font-mono text-xs">{formatCurrency(b.tax, "SGD")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-medium">
                      <td className="p-2" colSpan={3}>Total Tax Payable</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(totalTax, "SGD")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
