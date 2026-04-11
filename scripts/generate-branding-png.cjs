/**
 * Rasteriza assets/branding/hydronet_logo.svg → public/branding/hydronet-logo-from-svg.png
 *
 * NO sobrescribe public/branding/hydronet-logo-final.png si ya existe, para poder usar
 * un PNG aportado a mano (p. ej. logo exportado desde ChatGPT).
 * Si hydronet-logo-final.png no existe, se crea copiando desde el PNG generado.
 *
 * Ejecutar: npm run branding:png
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const assets = path.join(root, "assets", "branding");
const publicBranding = path.join(root, "public", "branding");

async function main() {
  await fs.promises.mkdir(publicBranding, { recursive: true });

  const logoSvg = path.join(assets, "hydronet_logo.svg");
  const fromSvgPng = path.join(publicBranding, "hydronet-logo-from-svg.png");
  const finalPng = path.join(publicBranding, "hydronet-logo-final.png");
  const finalSvg = path.join(publicBranding, "hydronet-logo-final.svg");

  await sharp(logoSvg)
    .resize({ width: 560, height: null })
    .png({ compressionLevel: 9 })
    .toFile(fromSvgPng);

  await fs.promises.copyFile(logoSvg, finalSvg);

  let finalExists = false;
  try {
    await fs.promises.access(finalPng);
    finalExists = true;
  } catch {
    finalExists = false;
  }

  if (!finalExists) {
    await fs.promises.copyFile(fromSvgPng, finalPng);
    console.log("Created", finalPng, "(from SVG; replace with your own PNG when needed)");
  } else {
    console.log(
      "Kept existing",
      finalPng,
      "(not overwritten). See hydronet-logo-from-svg.png for latest SVG export.",
    );
  }

  console.log("OK →", fromSvgPng, finalSvg);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
