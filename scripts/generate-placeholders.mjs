/**
 * Generates clean, brand-styled SVG placeholder product images.
 *
 * These are DEVELOPMENT PLACEHOLDERS. Replace them with real product
 * photography via the admin dashboard (Admin → Products → Images).
 *
 * Usage: node scripts/generate-placeholders.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

const NAVY = "#0B1F3A";
const GREEN = "#16A34A";

/** Each product: file, name lines, accent colour, bottle type. */
const products = [
  { file: "floor-cleaner", lines: ["Floor", "Cleaner"], accent: "#0EA5E9", type: "jug" },
  { file: "hand-wash", lines: ["Hand", "Wash"], accent: "#16A34A", type: "pump" },
  { file: "dish-wash", lines: ["Dish Wash", "Liquid"], accent: "#22C55E", type: "pump" },
  { file: "glass-cleaner", lines: ["Glass", "Cleaner"], accent: "#38BDF8", type: "spray" },
  { file: "toilet-cleaner", lines: ["Toilet", "Cleaner"], accent: "#6366F1", type: "neck" },
  { file: "bathroom-cleaner", lines: ["Bathroom", "Cleaner"], accent: "#8B5CF6", type: "spray" },
  { file: "multipurpose-cleaner", lines: ["Multipurpose", "Cleaner"], accent: "#14B8A6", type: "spray" },
  { file: "kitchen-degreaser", lines: ["Kitchen", "Degreaser"], accent: "#F59E0B", type: "spray" },
  { file: "car-shampoo", lines: ["Car", "Shampoo"], accent: "#0B1F3A", type: "jug" },
  { file: "dashboard-polish", lines: ["Dashboard", "Polish"], accent: "#1E293B", type: "pump" },
  { file: "tyre-polish", lines: ["Tyre", "Polish"], accent: "#334155", type: "neck" },
  { file: "car-wax", lines: ["Car", "Wax"], accent: "#B45309", type: "tub" },
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** White label panel with product name + brand mark. */
function label(y, height, nameLines, accent, fontSize = 34) {
  const firstY = y + 58;
  const nameSvg = nameLines
    .map(
      (l, i) =>
        `<text x="400" y="${firstY + i * (fontSize + 8)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${NAVY}">${esc(l)}</text>`
    )
    .join("\n  ");
  const brandY = y + height - 44;
  const subY = y + height - 22;
  return `  <rect x="300" y="${y}" width="200" height="${height}" rx="14" fill="#FFFFFF"/>
  <rect x="300" y="${y}" width="200" height="10" rx="5" fill="${accent}"/>
  ${nameSvg}
  <text x="400" y="${brandY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="3" fill="${GREEN}">SUPER CLEANER</text>
  <text x="400" y="${subY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" letter-spacing="1" fill="#64748B">JK INDUSTRIES</text>`;
}

/** Bottle illustration. Shapes stay within x: 200-600, y: 250-880. */
function bottle(type, accent, lines) {
  switch (type) {
    case "spray":
      return `  <ellipse cx="400" cy="875" rx="170" ry="26" fill="${NAVY}" opacity="0.08"/>
  <path d="M368 300 h64 a18 18 0 0 1 18 18 v52 h-100 v-52 a18 18 0 0 1 18 -18 z" fill="${accent}"/>
  <path d="M356 330 h-58 a14 14 0 0 0 -14 14 v20 a14 14 0 0 0 14 14 h38 z" fill="${accent}" opacity="0.85"/>
  <path d="M448 322 l58 -22 v26 l-58 12 z" fill="${accent}"/>
  <rect x="378" y="370" width="44" height="46" fill="#CBD5E1"/>
  <path d="M312 416 h176 a26 26 0 0 1 26 26 v374 a46 46 0 0 1 -46 46 h-136 a46 46 0 0 1 -46 -46 v-374 a26 26 0 0 1 26 -26 z" fill="${NAVY}"/>
  <path d="M318 430 h44 v420 h-24 a42 42 0 0 1 -42 -42 v-340 z" fill="#FFFFFF" opacity="0.07"/>
${label(500, 230, lines, accent)}`;
    case "pump":
      return `  <ellipse cx="400" cy="875" rx="150" ry="24" fill="${NAVY}" opacity="0.08"/>
  <path d="M380 268 h40 v34 h34 a12 12 0 0 1 12 12 v18 h-86 v-18 a12 12 0 0 1 12 -12 h-12 z" fill="${accent}"/>
  <rect x="378" y="332" width="44" height="52" fill="#CBD5E1"/>
  <rect x="352" y="384" width="96" height="30" rx="10" fill="${accent}"/>
  <rect x="308" y="414" width="184" height="420" rx="52" fill="${NAVY}"/>
  <rect x="330" y="440" width="34" height="330" rx="17" fill="#FFFFFF" opacity="0.07"/>
${label(500, 216, lines, accent, 30)}`;
    case "jug":
      return `  <ellipse cx="400" cy="878" rx="180" ry="27" fill="${NAVY}" opacity="0.08"/>
  <rect x="360" y="282" width="80" height="56" rx="14" fill="${accent}"/>
  <rect x="372" y="338" width="56" height="30" fill="#CBD5E1"/>
  <path d="M494 470 q86 10 86 96 q0 86 -86 96 v-44 q44 -8 44 -52 q0 -44 -44 -52 z" fill="${NAVY}"/>
  <path d="M296 368 h208 a24 24 0 0 1 24 24 v438 a40 40 0 0 1 -40 40 h-176 a40 40 0 0 1 -40 -40 v-438 a24 24 0 0 1 24 -24 z" fill="${NAVY}"/>
  <path d="M312 384 h40 v434 h-20 a36 36 0 0 1 -36 -36 v-376 z" fill="#FFFFFF" opacity="0.07"/>
${label(500, 228, lines, accent, 30)}`;
    case "neck":
      return `  <ellipse cx="400" cy="875" rx="140" ry="22" fill="${NAVY}" opacity="0.08"/>
  <rect x="362" y="262" width="76" height="44" rx="6" fill="${accent}"/>
  <path d="M376 306 h48 l12 100 h-72 z" fill="${NAVY}"/>
  <path d="M330 406 h140 a20 20 0 0 1 20 20 v370 a48 48 0 0 1 -48 48 h-84 a48 48 0 0 1 -48 -48 v-370 a20 20 0 0 1 20 -20 z" fill="${NAVY}"/>
  <path d="M340 420 h34 v350 h-14 a40 40 0 0 1 -40 -40 v-314 z" fill="#FFFFFF" opacity="0.07"/>
${label(500, 216, lines, accent, 28)}`;
    case "tub":
    default:
      return `  <ellipse cx="400" cy="812" rx="200" ry="28" fill="${NAVY}" opacity="0.08"/>
  <rect x="228" y="480" width="344" height="86" rx="26" fill="${accent}"/>
  <path d="M228 566 h344 v130 a56 56 0 0 1 -56 56 h-232 a56 56 0 0 1 -56 -56 z" fill="${NAVY}"/>
  <rect x="252" y="600" width="296" height="118" rx="12" fill="#FFFFFF"/>
  <rect x="252" y="600" width="296" height="10" rx="5" fill="${accent}"/>
  <text x="400" y="652" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${NAVY}">${esc(lines.join(" "))}</text>
  <text x="400" y="688" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="3" fill="${GREEN}">SUPER CLEANER</text>
  <text x="400" y="708" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11" letter-spacing="1" fill="#64748B">JK INDUSTRIES</text>`;
  }
}

function render(p) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img" aria-label="${esc(p.lines.join(" "))} product image placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F8FAFC"/>
      <stop offset="1" stop-color="#E8EDF4"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.45" r="0.55">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#bg)"/>
  <ellipse cx="400" cy="440" rx="360" ry="360" fill="url(#halo)"/>
  <rect x="620" y="60" width="120" height="120" rx="28" fill="${GREEN}" opacity="0.10"/>
  <rect x="60" y="820" width="120" height="120" rx="28" fill="${NAVY}" opacity="0.08"/>
${bottle(p.type, p.accent, p.lines)}
  <text x="400" y="954" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-style="italic" fill="#94A3B8">Placeholder image — replace with real product photo</text>
</svg>
`;
}

for (const p of products) {
  writeFileSync(join(outDir, `${p.file}.svg`), render(p), "utf8");
  console.log(`wrote public/products/${p.file}.svg`);
}
console.log("Done.");
