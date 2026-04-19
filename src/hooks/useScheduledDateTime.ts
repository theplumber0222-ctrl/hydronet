import { useMemo, useState } from "react";

/**
 * Fecha y hora separadas para que el resumen de cobro solo aparezca cuando el
 * cliente eligió un día (calendario) y una hora, como en el flujo Gold.
 */
export function useScheduledDateTime() {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const scheduledAt = useMemo(
    () =>
      scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}` : "",
    [scheduledDate, scheduledTime],
  );

  const minDateStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  return {
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    scheduledAt,
    minDateStr,
  };
}
