"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

type Props = {
  bookingId: string;
  scheduledAtIso: string;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RescheduleForm({ bookingId, scheduledAtIso }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(toLocalInput(scheduledAtIso));
  }, [scheduledAtIso]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const iso = new Date(value).toISOString();
    const res = await fetch(`/api/bookings/${bookingId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: iso }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(
        typeof data.error === "string" ? data.error : t("booking.errNetwork"),
      );
      return;
    }
    setMsg(t("reschedule.success"));
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-end gap-2">
      <input
        type="datetime-local"
        className="input-field max-w-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" disabled={loading} className="btn-secondary text-xs">
        {loading ? t("reschedule.loading") : t("reschedule.submit")}
      </button>
      {msg && <p className="w-full text-xs text-sky-400">{msg}</p>}
    </form>
  );
}
