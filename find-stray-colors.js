const fs = require("fs");
const path = require("path");

const cssDir = path.join(__dirname, "css");
const palette = {
  "#2196f3": "--blue",
  "#f44336": "--red",
  "#4caf50": "--green",
  "#ffc107": "--yellow",
  "#616161": "--gray",
  "#ffffff": "--white",
  "#000000": "--black",
};

const hexRegex = /#(?:[0-9a-fA-F]{3}){1,2}\b/g;
const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
const hslRegex = /hsla?\(\s*\d+\s*,\s*[\d.]%+\s*,\s*[\d.]%+\s*(?:,\s*[\d.]+\s*)?\)/g;

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(cssDir).filter((f) => f.endsWith(".css") && !f.includes("variables.css"));
const results = {};

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const matches = [
    ...(content.match(hexRegex) || []),
    ...(content.match(rgbRegex) || []),
    ...(content.match(hslRegex) || []),
  ];

  matches.forEach((match) => {
    const normalized = match.toLowerCase().replace(/\s+/g, "");
    // Simple check: is it in our baseline palette?
    // Note: this won't catch rgb equivalents of hex easily without conversion,
    // but it's a good start.
    if (!palette[normalized]) {
      if (!results[normalized]) results[normalized] = [];
      if (!results[normalized].includes(path.basename(file))) {
        results[normalized].push(path.basename(file));
      }
    }
  });
});

console.log(JSON.stringify(results, null, 2));
