import { Injectable, inject } from '@angular/core';
import { HttpService } from './http-service';
import { Observable } from 'rxjs';
import { IPayslip } from '../models/interfaces/IPayslip.interface';
import { EPayslipStatus } from '../models/enums/payslip-status.enum';
import { IPreapprovedItem } from '../models/interfaces/IPreapprovedItem.interface';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PayslipService {

  private httpService = inject(HttpService);

  /**
   * Gets all payslips for the current user.
   */
  public getMyPayslipHistory(): Observable<IPayslip[]> {
    return this.httpService.get<IPayslip[]>('payslips/my-history');
  }

  /**
   * Gets the current user's active payslip for the current month.
   */
  public getMyCurrentPayslip(): Observable<IPayslip | null> {
    return this.httpService.get<IPayslip | null>('payslips/me');
  }

  /**
   * Generates a new payslip for the current month.
   */
  public generateCurrentPayslip(): Observable<IPayslip> {
    return this.httpService.post<IPayslip>('payslips/generate', {});
  }

  /**
   * Updates the status of a given payslip.
   * @param payslipId The ID of the payslip to update.
   * @param status The new status.
   */
  public updatePayslipStatus(payslipId: string, status: EPayslipStatus): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/status`, { status });
  }

  /**
   * Adds a pre-approved item to a draft payslip.
   * @param payslipId The ID of the payslip.
   * @param itemId The ID of the pre-approved item.
   */
  public addPreapprovedItem(payslipId: string, itemId: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/add-item`, { itemId });
  }

  /**
   * Removes a pre-approved item from a draft payslip.
   * @param payslipId The ID of the payslip.
   * @param itemId The ID of the item to remove.
   */
  public removePreapprovedItem(payslipId: string, itemId: string): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/remove-item/${itemId}`);
  }

  /**
   * Adds a query to a payslip item.
   * @param payslipId The ID of the payslip.
   * @param itemId The ID of the item to query.
   * @param note The query note.
   */
  public addQuery(payslipId: string, itemId: string, note: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/query`, { itemId, note });
  }

  /**
   * Updates an existing query on a payslip.
   * @param payslipId The ID of the payslip.
   * @param queryId The ID of the query to update.
   * @param note The updated query note.
   */
  public updateQuery(payslipId: string, queryId: string, note: string): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/query/${queryId}`, { note });
  }

  /**
   * Deletes a query from a payslip.
   * @param payslipId The ID of the payslip.
   * @param queryId The ID of the query to delete.
   */
  public deleteQuery(payslipId: string, queryId: string): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/query/${queryId}`);
  }

  /**
   * Resolves a query on a payslip.
   * @param payslipId The ID of the payslip.
   * @param queryId The ID of the query to resolve.
   * @param resolutionNote The resolution note.
   */
  public resolveQuery(payslipId: string, queryId: string, resolutionNote: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/query/${queryId}/resolve`, { resolutionNote });
  }

  /**
   * Gets all pre-approved items.
   */
  public getPreapprovedItems(): Observable<IPreapprovedItem[]> {
    return this.httpService.get<IPreapprovedItem[]>('payslips/preapproved-items');
  }

  /**
   * Gets a specific payslip by its ID.
   * @param id The ID of the payslip to retrieve.
   */
  public getPayslipById(id: string): Observable<IPayslip> {
    return this.httpService.get<IPayslip>(`payslips/${id}`);
  }

  /**
   * Adds a bonus to a payslip.
   * @param payslipId The ID of the payslip.
   * @param bonus The bonus to add.
   */
  public addBonus(payslipId: string, bonus: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/bonuses`, bonus);
  }

  /**
   * Updates a bonus in a payslip.
   * @param payslipId The ID of the payslip.
   * @param bonusIndex The index of the bonus to update.
   * @param bonus The updated bonus data.
   */
  public updateBonus(payslipId: string, bonusIndex: number, bonus: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/bonuses/${bonusIndex}`, bonus);
  }

  /**
   * Removes a bonus from a payslip.
   * @param payslipId The ID of the payslip.
   * @param bonusIndex The index of the bonus to remove.
   */
  public removeBonus(payslipId: string, bonusIndex: number): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/bonuses/${bonusIndex}`);
  }

  // ===== EARNINGS CRUD METHODS =====

  /**
   * Updates an earning in a payslip.
   * @param payslipId The ID of the payslip.
   * @param earningIndex The index of the earning to update.
   * @param earning The updated earning data.
   */
  public updateEarning(payslipId: string, earningIndex: number, earning: { description: string; baseRate: number; hours: number; rate: number; date: string; total: number }): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/earnings/${earningIndex}`, earning);
  }

  // ===== DEDUCTION CRUD METHODS =====

  /**
   * Adds a deduction to a payslip.
   * @param payslipId The ID of the payslip.
   * @param deduction The deduction to add.
   */
  public addDeduction(payslipId: string, deduction: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/deductions`, deduction);
  }

  /**
   * Updates a deduction in a payslip.
   * @param payslipId The ID of the payslip.
   * @param deductionIndex The index of the deduction to update.
   * @param deduction The updated deduction data.
   */
  public updateDeduction(payslipId: string, deductionIndex: number, deduction: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/deductions/${deductionIndex}`, deduction);
  }

  /**
   * Removes a deduction from a payslip.
   * @param payslipId The ID of the payslip.
   * @param deductionIndex The index of the deduction to remove.
   */
  public removeDeduction(payslipId: string, deductionIndex: number): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/deductions/${deductionIndex}`);
  }

  // ===== MISC EARNINGS CRUD METHODS =====

  /**
   * Adds a misc earning to a payslip.
   * @param payslipId The ID of the payslip.
   * @param earning The misc earning to add.
   */
  public addMiscEarning(payslipId: string, earning: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/misc-earnings`, earning);
  }

  /**
   * Updates a misc earning in a payslip.
   * @param payslipId The ID of the payslip.
   * @param earningIndex The index of the misc earning to update.
   * @param earning The updated misc earning data.
   */
  public updateMiscEarning(payslipId: string, earningIndex: number, earning: { description: string; amount: number }): Observable<IPayslip> {
    return this.httpService.put<IPayslip>(`payslips/${payslipId}/misc-earnings/${earningIndex}`, earning);
  }

  /**
   * Removes a misc earning from a payslip.
   * @param payslipId The ID of the payslip.
   * @param earningIndex The index of the misc earning to remove.
   */
  public removeMiscEarning(payslipId: string, earningIndex: number): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/misc-earnings/${earningIndex}`);
  }

  // ===== ADMIN METHODS =====

  /**
   * Gets all payslips in the system (admin only).
   * @param filters Optional filters for status, userId, or payPeriod.
   */
  public getAllPayslips(filters?: { status?: string; userId?: string; payPeriod?: string }): Observable<IPayslip[]> {
    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.userId) {
      params = params.set('userId', filters.userId);
    }
    if (filters?.payPeriod) {
      params = params.set('payPeriod', filters.payPeriod);
    }

    return this.httpService.get<IPayslip[]>('payslips', params);
  }

  /**
   * Approves a payslip (changes status from StaffApproved to Locked).
   * @param payslipId The ID of the payslip to approve.
   */
  public approvePayslip(payslipId: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/approve`, {});
  }

  /**
   * Rejects a payslip (changes status from StaffApproved back to Draft).
   * @param payslipId The ID of the payslip to reject.
   */
  public rejectPayslip(payslipId: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/reject`, {});
  }

  /**
   * Marks a payslip as paid (changes status from Locked to Paid).
   * @param payslipId The ID of the payslip to mark as paid.
   */
  public markPayslipAsPaid(payslipId: string): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/mark-paid`, {});
  }

  /**
   * Adds an item to a payslip (admin only).
   * @param payslipId The ID of the payslip.
   * @param itemType The type of item ('earning', 'miscEarning', 'bonus', or 'deduction').
   * @param itemData The item data.
   */
  public addItemToPayslip(payslipId: string, itemType: string, itemData: { description: string; amount?: number; baseRate?: number; hours?: number; rate?: number; date?: string; total?: number }): Observable<IPayslip> {
    return this.httpService.post<IPayslip>(`payslips/${payslipId}/add-item`, { itemType, itemData });
  }

  /**
   * Removes an item from a payslip (admin only).
   * @param payslipId The ID of the payslip.
   * @param itemId The ID of the item to remove (format: type-index, e.g., 'earning-0').
   */
  public removeItemFromPayslip(payslipId: string, itemId: string): Observable<IPayslip> {
    return this.httpService.delete<IPayslip>(`payslips/${payslipId}/item/${itemId}`);
  }
}