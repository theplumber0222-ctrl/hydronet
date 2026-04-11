export type ServiceDateErrorCode =
  | "WEEKDAY_ONLY"
  | "WEEKEND_EMERGENCY_GOLD"
  /** Visita única fin de semana ($1,250 no socio): solo sáb–dom TN */
  | "EMERGENCY_WEEKEND_ONLY";

export class ServiceDateError extends Error {
  constructor(public readonly code: ServiceDateErrorCode) {
    super(code);
    this.name = "ServiceDateError";
  }
}
