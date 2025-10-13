# Performance Optimization Guide for SDP Angular Application

## Executive Summary

Your Angular application currently has a Lighthouse score of **50 on mobile** and **70 on desktop**. The primary issue is a **1.7MB main bundle** due to lack of lazy loading and suboptimal dependencies.

### Current Bundle Analysis
- **main-NEGTF5IF.js**: 1.7MB (CRITICAL - Too large!)
- **chunk-BWESATHD.js**: 401KB
- **chunk-CY3NCNOD.js**: 198KB
- **chunk-4YM4URYL.js**: 199KB
- **chunk-AKYHNUZV.js**: 155KB
- **Total Initial Load**: ~2.6MB

### Target Metrics
- Mobile Lighthouse Score: 90+
- Desktop Lighthouse Score: 95+
- Initial Bundle: <500KB
- Time to Interactive: <3.8s (mobile)
- First Contentful Paint: <2s

---

## Critical Issues Found

### 1. NO LAZY LOADING (Priority: CRITICAL)
**Impact**: Main bundle is 1.7MB - all routes load eagerly

**Current State** (app.routes.ts:1-81):
```typescript
import { AdminDashboard } from './dashboard/modules/admin-dashboard/admin-dashboard';
import { ClientDashboard } from './dashboard/modules/client-dashboard/client-dashboard';
// ... 20+ eager imports
```

**Solution**: Replace with optimized routes file
```bash
# Use the provided app.routes.optimized.ts
cp src/app/app.routes.optimized.ts src/app/app.routes.ts
```

**Expected Impact**: Reduce initial bundle from 1.7MB to ~300-400KB (70-75% reduction)

---

### 2. LODASH IMPORT ISSUE (Priority: HIGH)
**Impact**: Entire lodash library (~70KB) imported for just `cloneDeep`

**Current State** (remark-template-management.ts:12):
```typescript
import * as _ from 'lodash';  // Imports entire library!
```

**Solution**: Replace with native methods
```bash
# Use the provided optimized file
cp src/app/dashboard/modules/admin-dashboard/components/remark-template-management/remark-template-management.optimized.ts \
   src/app/dashboard/modules/admin-dashboard/components/remark-template-management/remark-template-management.ts
```

**Or manually replace**:
```typescript
// OLD
import * as _ from 'lodash';
this.fields = _.cloneDeep(template.fields);

// NEW
this.fields = structuredClone(template.fields);
```

**Expected Impact**: Remove 70KB from bundle

---

### 3. COMMONJS DEPENDENCIES (Priority: MEDIUM)
**Impact**: Optimization bailouts preventing tree-shaking

**Issues Found**:
- `html2canvas` (via jsPDF)
- `lodash` (see above)
- `canvg` dependencies (core-js modules)

**Solution**: Configure allowedCommonJsDependencies in angular.json
```json
{
  "architect": {
    "build": {
      "options": {
        "allowedCommonJsDependencies": [
          "lodash",
          "html2canvas",
          "rgbcolor"
        ]
      }
    }
  }
}
```

---

### 4. CHANGE DETECTION STRATEGY (Priority: MEDIUM)
**Impact**: Unnecessary re-renders across the application

**Current State**: Only 4 components use OnPush strategy

**Components Using OnPush**:
- `payslip-viewer.ts`
- `rate-management.ts`
- `payslip-history.ts`
- `leave-modal.ts`

**Solution**: Add OnPush to all components
```typescript
@Component({
  selector: 'app-your-component',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**Priority Components to Update**:
1. `admin-dashboard.ts`
2. `client-dashboard.ts`
3. `user-management.ts`
4. `student-management.ts`
5. `bundle-dashboard.ts`
6. All modal/dialog components

**Expected Impact**: 20-30% reduction in change detection cycles

---

### 5. JSPDF LAZY LOADING (Priority: MEDIUM)
**Impact**: Large PDF library loaded upfront

**Current State** (payslip-viewer.ts:509):
```typescript
public downloadPDF(payslip: IPayslip): void {
  import('jspdf').then(({ jsPDF }) => {
    // PDF generation code
  });
}
```

**Good News**: Already implemented! ✓

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 hours) - 60% improvement
1. ✅ **Implement Lazy Loading**
   - Replace app.routes.ts with app.routes.optimized.ts
   - Test all routes still work
   - Run build and verify bundle sizes

2. ✅ **Replace Lodash**
   - Update remark-template-management.ts
   - Remove lodash from package.json (optional)
   - Test template management functionality

3. **Update Angular Configuration**
   - Add allowedCommonJsDependencies
   - Enable additional optimizations
   - Test production build

**Expected Results**: Mobile 70+, Desktop 85+

### Phase 2: Medium Wins (2-4 hours) - 20% improvement
1. **Add OnPush Change Detection**
   - Start with dashboard components
   - Update all list/table components
   - Test for change detection issues

2. **Optimize Angular Material Imports**
   - Review all Material imports
   - Consider using standalone components
   - Remove unused Material modules

3. **Image Optimization**
   - Compress images in public folder
   - Add lazy loading for images
   - Consider WebP format

**Expected Results**: Mobile 80+, Desktop 90+

### Phase 3: Advanced Optimizations (4-8 hours) - 10% improvement
1. **Service Worker & Caching**
   - Implement Angular Service Worker
   - Configure caching strategies
   - Add offline support

2. **Bundle Analysis & Code Splitting**
   - Run webpack-bundle-analyzer
   - Split large chunks further
   - Review third-party dependencies

3. **Preloading Strategy**
   - Implement custom preload strategy
   - Preload critical routes
   - Balance performance vs prefetching

**Expected Results**: Mobile 90+, Desktop 95+

---

## Angular Configuration Optimizations

### Update angular.json

```json
{
  "architect": {
    "build": {
      "options": {
        "allowedCommonJsDependencies": [
          "lodash",
          "html2canvas",
          "rgbcolor"
        ],
        "optimization": {
          "scripts": true,
          "styles": {
            "minify": true,
            "inlineCritical": true
          },
          "fonts": true
        },
        "outputHashing": "all",
        "sourceMap": false,
        "namedChunks": false,
        "extractLicenses": true,
        "vendorChunk": true,
        "buildOptimizer": true
      },
      "configurations": {
        "production": {
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "500kB",
              "maximumError": "1MB"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "6kB",
              "maximumError": "10kB"
            }
          ]
        }
      }
    }
  }
}
```

---

## Testing Performance

### Run Playwright Performance Tests

```bash
# Run all performance tests
npm run test:perf

# View results
npm run test:perf:report

# Run with UI mode for debugging
npm run test:e2e:ui
```

### Manual Testing
1. **Chrome DevTools Lighthouse**
   - Open DevTools (F12)
   - Go to Lighthouse tab
   - Run both Mobile & Desktop audits

2. **Bundle Size Analysis**
   ```bash
   npm run analyze:size
   ```

3. **Build Size Check**
   ```bash
   npm run build
   # Check dist/SDPWeb/browser folder sizes
   ```

---

## Monitoring & Metrics

### Key Metrics to Track
- **Initial Bundle Size**: Target <500KB
- **Total Bundle Size**: Target <2MB
- **First Contentful Paint (FCP)**: Target <1.8s
- **Largest Contentful Paint (LCP)**: Target <2.5s
- **Time to Interactive (TTI)**: Target <3.8s
- **Total Blocking Time (TBT)**: Target <200ms
- **Cumulative Layout Shift (CLS)**: Target <0.1

### Tools
- Lighthouse (Chrome DevTools)
- Playwright Performance Tests
- webpack-bundle-analyzer
- Chrome Performance Monitor
- Web Vitals Extension

---

## Component-Specific Optimizations

### Calendar Components
```typescript
// Use virtual scrolling for large event lists
import { ScrollingModule } from '@angular/cdk/scrolling';

// Implement trackBy functions
trackByEventId(index: number, event: Event): string {
  return event.id;
}
```

### Table Components
```typescript
// Enable virtual scrolling for large datasets
<cdk-virtual-scroll-viewport itemSize="50" class="table-viewport">
  <tr *cdkVirtualFor="let row of data">
    <!-- row content -->
  </tr>
</cdk-virtual-scroll-viewport>
```

### Modal/Dialog Components
```typescript
// Already standalone - ensure OnPush strategy
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

---

## Common Pitfalls to Avoid

1. **Importing Entire Libraries**
   ```typescript
   // ❌ Bad
   import * as _ from 'lodash';
   import moment from 'moment';

   // ✅ Good
   import { cloneDeep } from 'lodash-es';
   import { format } from 'date-fns';
   ```

2. **Not Using TrackBy in ngFor**
   ```typescript
   // ❌ Bad
   <div *ngFor="let item of items">

   // ✅ Good
   <div *ngFor="let item of items; trackBy: trackById">
   ```

3. **Subscribing Without Unsubscribing**
   ```typescript
   // ✅ Use async pipe or takeUntilDestroyed
   import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

   constructor() {
     this.service.data$
       .pipe(takeUntilDestroyed())
       .subscribe(data => this.data = data);
   }
   ```

4. **Large Images Without Optimization**
   ```html
   <!-- ✅ Add loading="lazy" -->
   <img src="large-image.jpg" loading="lazy" alt="Description">
   ```

---

## Quick Reference Commands

```bash
# Build production
npm run build

# Analyze bundle size
npm run analyze:size

# Run performance tests
npm run test:perf

# View performance report
npm run test:perf:report

# Start dev server
npm start

# Run unit tests
npm test

# Run linting
npm run lint
```

---

## Expected Results After All Optimizations

### Bundle Sizes
- **Initial Bundle**: 300-400KB (from 1.7MB)
- **Lazy Chunks**: 50-200KB each
- **Total Initial Load**: 500-700KB (from 2.6MB)

### Lighthouse Scores
- **Mobile**: 90-95 (from 50)
- **Desktop**: 95-100 (from 70)

### Performance Metrics
- **FCP**: 0.8-1.2s (mobile)
- **LCP**: 1.5-2.0s (mobile)
- **TTI**: 2.0-3.0s (mobile)
- **TBT**: <150ms
- **CLS**: <0.05

---

## Next Steps

1. **Immediate Actions** (Do this first!)
   - [ ] Replace app.routes.ts with lazy-loaded version
   - [ ] Update remark-template-management.ts to remove lodash
   - [ ] Update angular.json with optimization settings
   - [ ] Run production build and verify bundle sizes

2. **Short Term** (This week)
   - [ ] Add OnPush to all dashboard components
   - [ ] Review and optimize Material imports
   - [ ] Run performance tests
   - [ ] Document baseline metrics

3. **Medium Term** (Next 2 weeks)
   - [ ] Implement service worker
   - [ ] Add preloading strategy
   - [ ] Optimize images
   - [ ] Review API response sizes

4. **Long Term** (Ongoing)
   - [ ] Monitor bundle sizes in CI/CD
   - [ ] Regular Lighthouse audits
   - [ ] Performance budget enforcement
   - [ ] User experience monitoring

---

## Support & Resources

### Documentation
- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

### Files Created
- `playwright.config.ts` - Playwright configuration
- `e2e/performance.spec.ts` - Performance test suite
- `app.routes.optimized.ts` - Lazy-loaded routes
- `remark-template-management.optimized.ts` - Lodash-free version
- `PERFORMANCE_OPTIMIZATION_GUIDE.md` - This document

### Contact
For questions or issues, refer to your Angular documentation or the performance testing results.

---

**Last Updated**: 2025-10-13
**Version**: 1.0
**Status**: Ready for Implementation
