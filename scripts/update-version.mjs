import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Update version in service worker
const swPath = join(process.cwd(), 'src', 'sw.js');
const swContent = readFileSync(swPath, 'utf-8');

// Generate new version based on current date and time
const now = new Date();
const version = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

// Update SW_VERSION in service worker
const updatedSwContent = swContent.replace(
  /const SW_VERSION = '[^']+';/,
  `const SW_VERSION = '${version}';`
);

writeFileSync(swPath, updatedSwContent);

// Update package.json version
const packagePath = join(process.cwd(), 'package.json');
const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));
packageContent.version = version;
writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));

console.log(`✅ Version updated to: ${version}`);
console.log(`📄 Files updated: sw.js, package.json`);