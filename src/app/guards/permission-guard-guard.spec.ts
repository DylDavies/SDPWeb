import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { permissionGuard } from './permission-guard-guard';
import { EPermission } from '../models/enums/permission.enum';

describe('permissionGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => permissionGuard([EPermission.ADMIN_DASHBOARD_VIEW])(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
