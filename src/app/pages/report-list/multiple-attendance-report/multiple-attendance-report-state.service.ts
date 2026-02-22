import { Injectable } from '@angular/core';

export interface MultipleAttendanceReportState {
  searchFormValue: any;
  attendanceRecords: any[];
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
export class MultipleAttendanceReportStateService {
  private state: MultipleAttendanceReportState | null = null;

  saveState(state: MultipleAttendanceReportState) {
    this.state = state;
  }

  getState(): MultipleAttendanceReportState | null {
    return this.state;
  }

  clearState() {
    this.state = null;
  }
}
