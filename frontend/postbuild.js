import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const routes = ['about', 'verify'];

try {
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error('dist/index.html not found. Ensure vite build completed before running postbuild.');
  }

  routes.forEach((route) => {
    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.copyFileSync(indexHtmlPath, path.join(routeDir, 'index.html'));
  });

  fs.copyFileSync(indexHtmlPath, path.join(distDir, '404.html'));
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

  console.log('Static routes and GitHub Pages artifacts generated successfully!');
} catch (error) {
  console.error('Postbuild failed:', error.message);
  process.exit(1);
}