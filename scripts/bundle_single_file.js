import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found! Run npm run build first.');
  process.exit(1);
}

let htmlContent = fs.readFileSync(indexPath, 'utf-8');

// Inline CSS
htmlContent = htmlContent.replace(/<link\s+rel="stylesheet"\s+href="\.\/assets\/([^"]+)">/g, (match, cssFile) => {
  const cssPath = path.join(distDir, 'assets', cssFile);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    return `<style>\n${cssContent}\n</style>`;
  }
  return match;
});

// Inline main scripts
htmlContent = htmlContent.replace(/<script\s+type="module"\s+crossorigin\s+src="\.\/assets\/([^"]+)"><\/script>/g, (match, jsFile) => {
  const jsPath = path.join(distDir, 'assets', jsFile);
  if (fs.existsSync(jsPath)) {
    let jsContent = fs.readFileSync(jsPath, 'utf-8');
    return `<script type="module">\n${jsContent}\n</script>`;
  }
  return match;
});

const outputPath = path.join(distDir, 'ZenReader_SingleFile_Standalone.html');
fs.writeFileSync(outputPath, htmlContent, 'utf-8');

console.log(`Single-file HTML document generated successfully at:\n${outputPath}`);
