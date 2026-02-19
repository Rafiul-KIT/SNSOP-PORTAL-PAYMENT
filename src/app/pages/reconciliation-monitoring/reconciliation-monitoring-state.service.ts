import { Injectable } from '@angular/core';

export interface ReconciliationMonitoringState {
  reconciliationFormValue: any;
  records: any[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  countyList: any[];
  payamList: any[];
  bomaList: any[];
  isShow: boolean;
  isLoading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationMonitoringStateService {
  private state: ReconciliationMonitoringState | null = null;

  saveState(state: ReconciliationMonitoringState) {
    this.state = state;
  }

  getState(): ReconciliationMonitoringState | null {
    return this.state;
  }

  clearState() {
    this.state = null;
  }
}
