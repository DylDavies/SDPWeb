import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PayslipService } from './payslip-service';
import { HttpService } from './http-service';
import { EPayslipStatus } from '../models/enums/payslip-status.enum';
import { IPayslip } from '../models/interfaces/IPayslip.interface';
import { IPreapprovedItem } from '../models/interfaces/IPreapprovedItem.interface';
import { of } from 'rxjs';

describe('PayslipService', () => {
  let service: PayslipService;
  let httpService: jasmine.SpyObj<HttpService>;

  // Mock data
  const mockPayslip: IPayslip = {
    _id: '123',
    userId: 'user1',
    payPeriod: '2024-09',
    status: EPayslipStatus.DRAFT,
    grossEarnings: 5000,
    totalDeductions: 500,
    netPay: 4500,
    paye: 750,
    uif: 50,
    earnings: [
      {
        description: 'Teaching Hours',
        baseRate: 50,
        hours: 20,
        rate: 150,
        total: 3050,
        date: '2024-09-15'
      }
    ],
    bonuses: [
      { description: 'Performance Bonus', amount: 500 }
    ],
    miscEarnings: [
      { description: 'Overtime', amount: 250 }
    ],
    deductions: [
      { description: 'Equipment Fee', amount: 150 }
    ],
    notes: [],
    history: []
  };

  const mockPayslips: IPayslip[] = [mockPayslip];

  const mockPreapprovedItem: IPreapprovedItem = {
    _id: 'item1',
    itemName: 'Performance Bonus',
    itemType: 'Bonus' as any,
    defaultAmount: 500,
    isAdminOnly: false
  };

  beforeEach(() => {
    const httpServiceSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PayslipService,
        { provide: HttpService, useValue: httpServiceSpy }
      ]
    });

    service = TestBed.inject(PayslipService);
    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMyPayslipHistory', () => {
    it('should get payslip history', () => {
      httpService.get.and.returnValue(of(mockPayslips));

      service.getMyPayslipHistory().subscribe(payslips => {
        expect(payslips).toEqual(mockPayslips);
      });

      expect(httpService.get).toHaveBeenCalledWith('payslips/my-history');
    });
  });

  describe('getMyCurrentPayslip', () => {
    it('should get current payslip', () => {
      httpService.get.and.returnValue(of(mockPayslip));

      service.getMyCurrentPayslip().subscribe(payslip => {
        expect(payslip).toEqual(mockPayslip);
      });

      expect(httpService.get).toHaveBeenCalledWith('payslips/me');
    });

    it('should handle null current payslip', () => {
      httpService.get.and.returnValue(of(null));

      service.getMyCurrentPayslip().subscribe(payslip => {
        expect(payslip).toBeNull();
      });

      expect(httpService.get).toHaveBeenCalledWith('payslips/me');
    });
  });

  describe('generateCurrentPayslip', () => {
    it('should generate a new payslip', () => {
      httpService.post.and.returnValue(of(mockPayslip));

      service.generateCurrentPayslip().subscribe(payslip => {
        expect(payslip).toEqual(mockPayslip);
      });

      expect(httpService.post).toHaveBeenCalledWith('payslips/generate', {});
    });
  });

  describe('updatePayslipStatus', () => {
    it('should update payslip status', () => {
      const updatedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      httpService.put.and.returnValue(of(updatedPayslip));

      service.updatePayslipStatus('123', EPayslipStatus.STAFF_APPROVED).subscribe(payslip => {
        expect(payslip.status).toBe(EPayslipStatus.STAFF_APPROVED);
      });

      expect(httpService.put).toHaveBeenCalledWith('payslips/123/status', { status: EPayslipStatus.STAFF_APPROVED });
    });
  });

  describe('addPreapprovedItem', () => {
    it('should add preapproved item to payslip', () => {
      httpService.post.and.returnValue(of(mockPayslip));

      service.addPreapprovedItem('123', 'item1').subscribe(payslip => {
        expect(payslip).toEqual(mockPayslip);
      });

      expect(httpService.post).toHaveBeenCalledWith('payslips/123/add-item', { itemId: 'item1' });
    });
  });

  describe('removePreapprovedItem', () => {
    it('should remove preapproved item from payslip', () => {
      httpService.delete.and.returnValue(of(mockPayslip));

      service.removePreapprovedItem('123', 'item1').subscribe(payslip => {
        expect(payslip).toEqual(mockPayslip);
      });

      expect(httpService.delete).toHaveBeenCalledWith('payslips/123/remove-item/item1');
    });
  });

  describe('Query Management', () => {
    describe('addQuery', () => {
      it('should add query to payslip', () => {
        httpService.post.and.returnValue(of(mockPayslip));

        service.addQuery('123', 'item1', 'Query note').subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.post).toHaveBeenCalledWith('payslips/123/query', { itemId: 'item1', note: 'Query note' });
      });
    });

    describe('updateQuery', () => {
      it('should update query', () => {
        httpService.put.and.returnValue(of(mockPayslip));

        service.updateQuery('123', 'query1', 'Updated note').subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.put).toHaveBeenCalledWith('payslips/123/query/query1', { note: 'Updated note' });
      });
    });

    describe('deleteQuery', () => {
      it('should delete query', () => {
        httpService.delete.and.returnValue(of(mockPayslip));

        service.deleteQuery('123', 'query1').subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.delete).toHaveBeenCalledWith('payslips/123/query/query1');
      });
    });

    describe('resolveQuery', () => {
      it('should resolve query', () => {
        httpService.post.and.returnValue(of(mockPayslip));

        service.resolveQuery('123', 'query1', 'Resolution note').subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.post).toHaveBeenCalledWith('payslips/123/query/query1/resolve', { resolutionNote: 'Resolution note' });
      });
    });
  });

  describe('getPreapprovedItems', () => {
    it('should get preapproved items', () => {
      const mockItems = [mockPreapprovedItem];
      httpService.get.and.returnValue(of(mockItems));

      service.getPreapprovedItems().subscribe(items => {
        expect(items).toEqual(mockItems);
      });

      expect(httpService.get).toHaveBeenCalledWith('payslips/preapproved-items');
    });
  });

  describe('getPayslipById', () => {
    it('should get payslip by ID', () => {
      httpService.get.and.returnValue(of(mockPayslip));

      service.getPayslipById('123').subscribe(payslip => {
        expect(payslip).toEqual(mockPayslip);
      });

      expect(httpService.get).toHaveBeenCalledWith('payslips/123');
    });
  });

  describe('Bonus Management', () => {
    const bonusData = { description: 'Test Bonus', amount: 300 };

    describe('addBonus', () => {
      it('should add bonus to payslip', () => {
        httpService.post.and.returnValue(of(mockPayslip));

        service.addBonus('123', bonusData).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.post).toHaveBeenCalledWith('payslips/123/bonuses', bonusData);
      });
    });

    describe('removeBonus', () => {
      it('should remove bonus from payslip', () => {
        httpService.delete.and.returnValue(of(mockPayslip));

        service.removeBonus('123', 0).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.delete).toHaveBeenCalledWith('payslips/123/bonuses/0');
      });
    });
  });

  describe('Deduction Management', () => {
    const deductionData = { description: 'Test Deduction', amount: 100 };

    describe('addDeduction', () => {
      it('should add deduction to payslip', () => {
        httpService.post.and.returnValue(of(mockPayslip));

        service.addDeduction('123', deductionData).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.post).toHaveBeenCalledWith('payslips/123/deductions', deductionData);
      });
    });

    describe('updateDeduction', () => {
      it('should update deduction', () => {
        httpService.put.and.returnValue(of(mockPayslip));

        service.updateDeduction('123', 0, deductionData).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.put).toHaveBeenCalledWith('payslips/123/deductions/0', deductionData);
      });
    });

    describe('removeDeduction', () => {
      it('should remove deduction from payslip', () => {
        httpService.delete.and.returnValue(of(mockPayslip));

        service.removeDeduction('123', 0).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.delete).toHaveBeenCalledWith('payslips/123/deductions/0');
      });
    });
  });

  describe('Misc Earnings Management', () => {
    const earningData = { description: 'Test Earning', amount: 200 };

    describe('addMiscEarning', () => {
      it('should add misc earning to payslip', () => {
        httpService.post.and.returnValue(of(mockPayslip));

        service.addMiscEarning('123', earningData).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.post).toHaveBeenCalledWith('payslips/123/misc-earnings', earningData);
      });
    });

    describe('updateMiscEarning', () => {
      it('should update misc earning', () => {
        httpService.put.and.returnValue(of(mockPayslip));

        service.updateMiscEarning('123', 0, earningData).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.put).toHaveBeenCalledWith('payslips/123/misc-earnings/0', earningData);
      });
    });

    describe('removeMiscEarning', () => {
      it('should remove misc earning from payslip', () => {
        httpService.delete.and.returnValue(of(mockPayslip));

        service.removeMiscEarning('123', 0).subscribe(payslip => {
          expect(payslip).toEqual(mockPayslip);
        });

        expect(httpService.delete).toHaveBeenCalledWith('payslips/123/misc-earnings/0');
      });
    });
  });
});