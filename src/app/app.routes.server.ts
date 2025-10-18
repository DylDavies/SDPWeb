import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-side routing configuration for Angular SSR
 *
 * All routes use RenderMode.Server which means they are rendered on-demand
 * when requested (true SSR), not prerendered at build time.
 *
 * This configuration tells Angular to use server-side rendering for all routes.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];