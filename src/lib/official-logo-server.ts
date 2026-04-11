import fs from "fs";
import path from "path";

/** Misma imagen que OFFICIAL_LOGO_URL (servidor / PDF). */
const OFFICIAL_LOGO_FILE = path.join(
  process.cwd(),
  "public",
  "branding",
  "hydronet-logo-final.png",
);

export function readOfficialLogoPng(): Buffer | null {
  try {
    return fs.readFileSync(OFFICIAL_LOGO_FILE);
  } catch {
    return null;
  }
}
