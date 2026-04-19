export type ServiceDateErrorCode =
  | "WEEKDAY_ONLY"
  | "WEEKEND_EMERGENCY_GOLD"
  /** Visita única no socio: lun–vie solo 8am–4pm TN para tarifa $950 */
  | "CONNECT_WEEKDAY_HOURS_ONLY"
  /** Fuera de ventanas públicas (ej. fin de semana fuera de 8–16 TN) */
  | "PUBLIC_SLOT_OUT_OF_HOURS";

export class ServiceDateError extends Error {
  constructor(public readonly code: ServiceDateErrorCode) {
    super(code);
    this.name = "ServiceDateError";
  }
}
