"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Plus, Trash2, Save } from "lucide-react";

const COLORS = [
  "oklch(0.646 0.222 41.116)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.398 0.07 227.392)",
  "oklch(0.828 0.189 84.429)",
  "oklch(0.769 0.188 70.08)",
  "oklch(0.488 0.243 264.376)",
  "oklch(0.696 0.17 162.48)",
  "oklch(0.627 0.265 303.9)",
];

interface Allocation {
  id?: number;
  category: string;
  amount: number;
}

export function BudgetClient({
  initialSalary,
  initialAllocations,
}: {
  initialSalary: number;
  initialAllocations: Allocation[];
}) {
  const router = useRouter();
  const [salary, setSalary] = useState(initialSalary.toString());
  const [allocations, setAllocations] = useState<Allocation[]>(
    initialAllocations.length > 0 ? initialAllocations : [{ category: "", amount: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const salaryNum = parseFloat(salary) || 0;
  const totalAllocated = allocations.reduce((s, a) => s + (a.amount || 0), 0);
  const remaining = salaryNum - totalAllocated;
  const remainingPercent = salaryNum > 0 ? (remaining / salaryNum) * 100 : 0;

  function updateAllocation(index: number, field: "category" | "amount", value: string) {
    const updated = [...allocations];
    if (field === "amount") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAllocations(updated);
    setDirty(true);
  }

  function addRow() {
    setAllocations([...allocations, { category: "", amount: 0 }]);
    setDirty(true);
  }

  function removeRow(index: number) {
    setAllocations(allocations.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salary: salaryNum,
        allocations: allocations
          .filter((a) => a.category.trim() !== "")
          .map((a) => ({ category: a.category, amount: a.amount })),
      }),
    });
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  const chartData = [
    ...allocations
      .filter((a) => a.category.trim() && a.amount > 0)
      .map((a) => ({ name: a.category, value: a.amount })),
    ...(remaining > 0 ? [{ name: "Remaining", value: remaining }] : []),
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="salary">Gross Monthly Income (SGD)</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              min="0"
              value={salary}
              onChange={(e) => { setSalary(e.target.value); setDirty(true); }}
              className="mt-1 text-lg font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Allocations</CardTitle>
            <Button onClick={handleSave} disabled={saving || !dirty} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-right p-3 font-medium">%</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc, i) => {
                    const pct = salaryNum > 0 ? (alloc.amount / salaryNum) * 100 : 0;
                    return (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          <Input
                            placeholder="e.g. Investments"
                            value={alloc.category}
                            onChange={(e) => updateAllocation(i, "category", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={alloc.amount || ""}
                            onChange={(e) => updateAllocation(i, "amount", e.target.value)}
                            className="h-8 text-sm font-mono text-right"
                          />
                        </td>
                        <td className="p-3 text-right font-mono text-sm text-muted-foreground">
                          {formatPercent(pct)}
                        </td>
                        <td className="p-2 text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(i)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-b">
                    <td colSpan={4} className="p-2">
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addRow}>
                        <Plus className="h-3.5 w-3.5 mr-2" /> Add Category
                      </Button>
                    </td>
                  </tr>
                  <tr className="bg-muted/30 font-medium">
                    <td className="p-3">Total Allocated</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(totalAllocated, "SGD")}</td>
                    <td className="p-3 text-right font-mono text-sm">
                      {salaryNum > 0 ? formatPercent((totalAllocated / salaryNum) * 100) : "—"}
                    </td>
                    <td></td>
                  </tr>
                  <tr className={`font-medium ${remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    <td className="p-3">Remaining</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(remaining, "SGD")}</td>
                    <td className="p-3 text-right font-mono text-sm">
                      {salaryNum > 0 ? formatPercent(remainingPercent) : "—"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Add allocations to see your breakdown.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value), "SGD")} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
