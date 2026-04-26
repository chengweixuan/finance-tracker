"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export function DashboardActions() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function takeSnapshot() {
    setSaving(true);
    await fetch("/api/net-worth", { method: "POST" });
    setSaving(false);
    router.refresh();
  }

  return (
    <Button onClick={takeSnapshot} disabled={saving} variant="outline" size="sm">
      <Camera className="h-4 w-4 mr-2" />
      {saving ? "Saving..." : "Take Snapshot"}
    </Button>
  );
}
