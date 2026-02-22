import { Injectable } from '@angular/core';

export interface WageRequestState {
  searchFormValue: any;
  abstractRecords: any[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  hasSearched: boolean;
  countyList: any[];
  payamList: any[];
  bomaList: any[];
}

@Injectable({
  providedIn: 'root'
})
export class WageRequestStateService {
  private state: WageRequestState | null = null;

  saveState(state: WageRequestState) {
    this.state = state;
  }

  getState(): WageRequestState | null {
    return this.state;
  }

  clearState() {
    this.state = null;
  }
}
