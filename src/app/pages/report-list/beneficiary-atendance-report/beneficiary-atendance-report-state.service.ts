import { Injectable } from '@angular/core';

export interface BeneficiaryAttendanceReportState {
  // Step 1: Sub-project search state
  subprojectSearchFormValue: any;
  subprojectList: any[];
  selectedSubproject: any | null;
  subprojectPage: number;
  subprojectSize: number;
  totalSubprojects: number;
  
  // Step 2: Attendance report state
  attendanceFormValue: any;
  records: any[];
  dateColumns: string[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  hasSearchedAttendance: boolean;

  // Shared lookups
  countyList: any[];
  payamList: any[];
  bomaList: any[];
}

@Injectable({
  providedIn: 'root'
})
export class BeneficiaryAttendanceReportStateService {
  private state: BeneficiaryAttendanceReportState | null = null;

  saveState(state: BeneficiaryAttendanceReportState) {
    this.state = state;
  }

  getState(): BeneficiaryAttendanceReportState | null {
    return this.state;
  }

  clearState() {
    this.state = null;
  }
}
