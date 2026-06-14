const fs = require('fs');
const path = require('path');

const srcStr = "C:\\Users\\perso\\.gemini\\antigravity\\brain\\db7850ad-e92a-40d9-8dc7-c518d3ccbda2\\aniverse_app_icon_1775562201034.png";
const publicIconsDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// manifest.json uses these files
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const destStr = path.join(publicIconsDir, `icon-${size}x${size}.png`);
  fs.copyFileSync(srcStr, destStr);
});

console.log("Icons copied successfully!");
