import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import compression from 'compression';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// --- Helper function to fetch IDs and format them correctly ---
async function fetchIds(apiUrl: string, paramName: string): Promise<Record<string, string>[]> {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    const ids = await response.json() as string[]; // Assuming the API returns string[]
    return ids.map(id => ({ [paramName]: id })); // Format as [{ id: '1' }, { id: '2' }]
  } catch (error) {
    console.error(`❌ Failed to fetch prerender params from ${apiUrl}:`, error);
    return []; // Return empty array on error to prevent build failure
  }
}

// --- Specific functions for each route, exported for use in other files ---

const API_BASE_URL = process.env['API_URL'] || 'http://localhost:8080';

export async function getProfilePrerenderParams(): Promise<Record<string, string>[]> {
  return fetchIds(`${API_BASE_URL}/api/internal/users/ids`, 'id');
}

export async function getStudentInfoPrerenderParams(): Promise<Record<string, string>[]> {
  return fetchIds(`${API_BASE_URL}/api/internal/student/ids`, 'id');
}

export async function getPayslipPrerenderParams(): Promise<Record<string, string>[]> {
  return fetchIds(`${API_BASE_URL}/api/internal/payslip/ids`, 'id');
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

app.use(compression({
  level: 6,
  threshold: 10 * 1024, // Only compress files > 10KB
}));

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
