import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

const routes = ['about', 'verify'];

routes.forEach(route => {
  const routeDir = path.join(distDir, route);
  
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  
  fs.copyFileSync(
    path.join(distDir, 'index.html'), 
    path.join(routeDir, 'index.html')
  );
});

console.log('Real static routes generated successfully!');