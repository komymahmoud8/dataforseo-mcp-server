import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json (3 levels up from utils/version.ts)
const packageJsonPath = path.resolve(__dirname, '../../package.json');

// Read and parse package.json
let packageVersion = '1.0.0'; // Default version
let packageName = 'dataforseo-mcp-server';

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageVersion = packageJson.version || packageVersion;
  packageName = packageJson.name.split('-')[0] || packageName;
} catch (error) {
  console.error('Error reading package.json version:', error);
}

export const version = packageVersion;
export const name = packageName;

export default {
  version,
  name
}; 