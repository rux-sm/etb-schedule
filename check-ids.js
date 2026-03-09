const fs = require("fs");
const content = fs.readFileSync("index.html", "utf8");
const regex = /\bid=["']([^"']+)["']/g;
let match;
const counts = {};
while ((match = regex.exec(content)) !== null) {
  counts[match[1]] = (counts[match[1]] || 0) + 1;
}
const dups = Object.keys(counts).filter((id) => counts[id] > 1);
console.log("Duplicate IDs:", dups);
