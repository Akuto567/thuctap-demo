// inject-data.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to this script
const dataFile = path.join(__dirname, "data.json");
const distFile = path.join(__dirname, "../../dist/index.html");
const outputFile = path.join(__dirname, "index.withdata.html");

// Read JSON data
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

// Read the built HTML
let html = fs.readFileSync(distFile, "utf8");

// Create the injection script
const injection = `<script>
window.MY_APP_DATA = ${JSON.stringify(data)};
</script>`;

// Insert before the first <script> tag (your bundle)
html = html.replace(/<script/, injection + "\n<script");

// Write to a new file in the same directory as this script
fs.writeFileSync(outputFile, html, "utf8");

console.log(`Injected MY_APP_DATA from ${dataFile} into ${outputFile}`);
