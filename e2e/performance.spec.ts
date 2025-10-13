import { test, expect } from '@playwright/test';

/**
 * Performance testing suite for Angular application
 * Measures bundle sizes, load times, and Lighthouse metrics
 */

test.describe('Performance Metrics', () => {
  test('should measure landing page load performance', async ({ page }) => {
    const startTime = Date.now();

    // Start measuring performance
    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    console.log(`Landing page load time: ${loadTime}ms`);

    // Assert load time is under 5 seconds (adjust based on your requirements)
    expect(loadTime).toBeLessThan(5000);

    // Check that critical content is visible
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('should measure bundle sizes', async ({ page }) => {
    const bundles: { url: string; size: number; type: string }[] = [];

    page.on('response', async (response) => {
      const url = response.url();

      // Track JavaScript bundles
      if (url.includes('.js') && !url.includes('node_modules')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          const sizeInKB = buffer.length / 1024;
          bundles.push({
            url: url.split('/').pop() || url,
            size: Math.round(sizeInKB),
            type: 'JavaScript'
          });
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Log all bundles
    console.log('\n=== Bundle Sizes ===');
    bundles.forEach(bundle => {
      console.log(`${bundle.url}: ${bundle.size} KB`);
    });

    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    console.log(`\nTotal bundle size: ${totalSize} KB`);

    // Main bundle should be under 500KB (adjust based on requirements)
    const mainBundle = bundles.find(b => b.url.includes('main'));
    if (mainBundle) {
      console.log(`\nMain bundle size: ${mainBundle.size} KB`);
      expect(mainBundle.size).toBeLessThan(500);
    }
  });

  test('should measure First Contentful Paint (FCP)', async ({ page }) => {
    await page.goto('/');

    const performanceMetrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
    });

    const paintMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return entries.map(entry => ({
        name: entry.name,
        startTime: entry.startTime
      }));
    });

    console.log('\n=== Performance Metrics ===');
    console.log('DOM Content Loaded:', performanceMetrics.domContentLoadedEventEnd, 'ms');
    console.log('Load Complete:', performanceMetrics.loadEventEnd, 'ms');
    console.log('\n=== Paint Metrics ===');
    paintMetrics.forEach(metric => {
      console.log(`${metric.name}: ${metric.startTime.toFixed(2)} ms`);
    });

    const fcp = paintMetrics.find(m => m.name === 'first-contentful-paint');
    if (fcp) {
      // FCP should be under 2 seconds for good performance
      expect(fcp.startTime).toBeLessThan(2000);
    }
  });

  test('should measure Time to Interactive (TTI)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for the page to be fully interactive
    await page.waitForLoadState('networkidle');

    const tti = Date.now() - startTime;
    console.log(`Time to Interactive: ${tti}ms`);

    // TTI should be under 3.8 seconds for good mobile performance
    expect(tti).toBeLessThan(3800);
  });

  test('should check for render-blocking resources', async ({ page }) => {
    const blockingResources: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      const headers = response.headers();

      // Check for synchronous scripts and stylesheets
      if ((url.endsWith('.js') || url.endsWith('.css')) &&
          !url.includes('async') &&
          !url.includes('defer')) {
        blockingResources.push(url);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    console.log('\n=== Render-Blocking Resources ===');
    console.log(`Found ${blockingResources.length} potentially blocking resources`);
    blockingResources.forEach(resource => {
      console.log(`- ${resource.split('/').pop()}`);
    });
  });

  test('should measure navigation timing for dashboard', async ({ page }) => {
    // Note: This test requires authentication setup
    // You may need to adjust this based on your auth flow

    await page.goto('/');

    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domComplete - timing.domLoading,
      };
    });

    console.log('\n=== Navigation Timing ===');
    console.log(`DNS Lookup: ${performanceTiming.dns}ms`);
    console.log(`TCP Connection: ${performanceTiming.tcp}ms`);
    console.log(`Request Time: ${performanceTiming.request}ms`);
    console.log(`Response Time: ${performanceTiming.response}ms`);
    console.log(`DOM Processing: ${performanceTiming.dom}ms`);

    // Assertions for reasonable timing
    expect(performanceTiming.dns).toBeLessThan(500);
    expect(performanceTiming.response).toBeLessThan(2000);
  });
});

test.describe('Mobile Performance', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  test('should load quickly on mobile', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    console.log(`Mobile load time: ${loadTime}ms`);

    // Mobile should load within 6 seconds
    expect(loadTime).toBeLessThan(6000);
  });

  test('should have mobile-optimized bundles', async ({ page }) => {
    const bundles: number[] = [];

    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('.js')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          bundles.push(buffer.length / 1024);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const totalSize = bundles.reduce((sum, size) => sum + size, 0);
    console.log(`Total mobile bundle size: ${totalSize.toFixed(2)} KB`);

    // Mobile total should be under 2MB
    expect(totalSize).toBeLessThan(2048);
  });
});

test.describe('Resource Optimization', () => {
  test('should check for duplicate resources', async ({ page }) => {
    const resources = new Map<string, number>();

    page.on('response', async (response) => {
      const url = new URL(response.url()).pathname;
      resources.set(url, (resources.get(url) || 0) + 1);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    const duplicates = Array.from(resources.entries())
      .filter(([_, count]) => count > 1)
      .map(([url, count]) => ({ url, count }));

    console.log('\n=== Duplicate Resources ===');
    if (duplicates.length > 0) {
      console.log('Found duplicate resource requests:');
      duplicates.forEach(({ url, count }) => {
        console.log(`${url}: loaded ${count} times`);
      });
    } else {
      console.log('No duplicate resources found!');
    }

    // Ideally, no resources should be loaded more than once
    expect(duplicates.length).toBe(0);
  });

  test('should check for compression', async ({ page }) => {
    const uncompressedResources: string[] = [];

    page.on('response', async (response) => {
      const headers = response.headers();
      const contentEncoding = headers['content-encoding'];
      const contentType = headers['content-type'];

      // Check if text-based resources are compressed
      if ((contentType?.includes('javascript') ||
           contentType?.includes('css') ||
           contentType?.includes('html')) &&
          !contentEncoding) {
        uncompressedResources.push(response.url());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    console.log('\n=== Compression Check ===');
    if (uncompressedResources.length > 0) {
      console.log('Uncompressed resources found:');
      uncompressedResources.forEach(url => {
        console.log(`- ${url.split('/').pop()}`);
      });
    } else {
      console.log('All resources are properly compressed!');
    }
  });
});
