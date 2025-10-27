import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ApiService } from '../../services/api.service';
import { LookupService } from '../../services/lookup.service';
import { LoadingSpinner } from "../../components/loading-spinner/loading-spinner";
import { Loader } from "../../components/loader/loader";
import { ReportBeneficiaryList } from "../report-list/report-beneficiary-list/report-beneficiary-list";
import { ReportStaffWiseBeneficiaryCount } from "../report-list/report-staff-wise-beneficiary-count/report-staff-wise-beneficiary-count";
import { ReportAgeGroupGenderWiseBeneficiaryCount } from "../report-list/report-age-group-gender-wise-beneficiary-count/report-age-group-gender-wise-beneficiary-count";
import { ReportMatchList } from "../report-list/report-match-list/report-match-list";
import { ReportLocationWiseNomineeCount } from "../report-list/report-location-wise-nominee-count/report-location-wise-nominee-count";
import { ReportCompleteHouseholdSurvey } from "../report-list/report-complete-household-survey/report-complete-household-survey";
import { ReportReconciledSummaryResult } from "../report-list/report-reconciled-summary-result/report-reconciled-summary-result";
import { ReportReconciliationSummaryCount } from "../report-list/report-reconciliation-summary-count/report-reconciliation-summary-count";
import { Button } from "primeng/button";
import { ActivatedRoute, Data } from '@angular/router';


@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbModule, LoadingSpinner, Loader, ReportBeneficiaryList, ReportStaffWiseBeneficiaryCount, ReportAgeGroupGenderWiseBeneficiaryCount, ReportMatchList, ReportLocationWiseNomineeCount, ReportCompleteHouseholdSurvey, ReportReconciledSummaryResult, ReportReconciliationSummaryCount, Button],
  templateUrl: './report.html',
  styleUrls: ['./report.scss']
})
export class ReportComponent implements OnInit {

  isLoading: boolean = true;
  isReportGenerating: boolean = false;
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;

  userList: any[] = [];
  countyList: any[] = [];
  payamList: any[] = [];
  bomaList: any[] = [];

  reportOptions: boolean = true;
  selectedReportTypeId: number = 0;
  selectedReportTypeTitle: string = '';
  reportBeneficiaryListResult: any = null;
  reportStaffWiseBeneficiaryCountResult: any = null;
  reportAgeGroupGenderWiseCountResult: any = null;
  reportLocationWiseNomineeCount: any = null;
  reportHouseholdSurvery: any = null;
  reportReconciledSummaryResult: any = null;
  reportReconciledSummaryTotals = {
    totalBeneficiaries: 0,
    totalPaid: 0,
    totalUnpaid: 0
  };
  reportReconciliationSummaryCount: any = null;
  reportMatchListResult: any = null;

  date: Date[] | undefined;
  reportForm: FormGroup = new FormGroup({});

  constructor(
      private route: ActivatedRoute,
    private apiService : ApiService, 
    public lookupService: LookupService
  ) { }

  showReportForm = (reportType: number, reportTitle: string): void => {
    // Reset all report results
    this.reportBeneficiaryListResult = null;
    this.reportStaffWiseBeneficiaryCountResult = null;
    this.reportAgeGroupGenderWiseCountResult = null;
    this.reportMatchListResult = null;
    this.reportLocationWiseNomineeCount = null;
    this.reportHouseholdSurvery = null;
    this.reportReconciledSummaryResult = null;
    this.reportReconciliationSummaryCount = null;

    switch (reportType) {
      case 1:
        this.reportForm = new FormGroup({
          size: new FormControl(10, Validators.required),
          from: new FormControl(0, Validators.required),
          stateId: new FormControl(''),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;
      case 2:
        this.getStaffList();
        this.reportForm = new FormGroup({
          fromDate: new FormControl('', Validators.required),
          toDate: new FormControl('', Validators.required),
          staffUserName: new FormControl('', Validators.required),
          registrationPhase: new FormControl('')
        });
        break;
      case 3:
        this.reportForm = new FormGroup({
          size: new FormControl(10000, Validators.required),
          from: new FormControl(0, Validators.required),
        });
        break;
      case 4:
        this.reportForm = new FormGroup({
          size: new FormControl(10000, Validators.required),
          from: new FormControl(0, Validators.required),
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
        });
        break;
      case 5:
        this.reportForm = new FormGroup({
          size: new FormControl(10000, Validators.required),
          from: new FormControl(0, Validators.required),
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;
      case 6:
        this.reportForm = new FormGroup({
          size: new FormControl(10000, Validators.required),
          page: new FormControl(0, Validators.required),
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl('')
        });
        break;
      case 7:
        this.reportForm = new FormGroup({
          page: new FormControl(0, Validators.required),
          registrationPhase: new FormControl('')
        });
        break;
      case 8:
        this.reportForm = new FormGroup({
          from: new FormControl(0, Validators.required),
        });
        break;
      case 9:
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl('', Validators.required),
          bomaId: new FormControl('', Validators.required),
          scheme: new FormControl('ALL', Validators.required),
          paymentStatus: new FormControl('ALL', Validators.required),
          size: new FormControl(1000, Validators.required),
          paymentCycle: new FormControl('1', Validators.required)
        });
        break;
      case 10:
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl('', Validators.required),
          bomaId: new FormControl(''),
          paymentCycle: new FormControl('1', Validators.required)
        });
        break;
      default:
        this.reportForm.reset();
        break;
    }
    this.selectedReportTypeId = reportType;
    this.selectedReportTypeTitle = reportTitle;
    this.reportOptions = false;
  }

  getStaffList = (): void => {
    const payload = {
      page: 0,
      size: 500,
      sortColumn: "ID",
      sortOrder: "DESC"
    };
    this.apiService.POST('api/user/search', payload).then(res => {
      if (res.status === 200) {
        this.userList = res.data.users;
      }
    }).catch(err => {
      console.error(err);
      this.userList = [];
    });
  }

  getCountyLookupByStateId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const stateId = target.value;
    this.apiService.POST('api/lookup/search', { 
      lookupType: "COUNTY", 
      parentId: (stateId !== '-1') ? stateId : "", 
      size: -1 
    }).then(res => {
      if (res.status === 200) {
        this.countyList = res.data.lookups;
        this.payamList = [];
        this.bomaList = [];
        this.reportForm.patchValue({
          countyId: '',
          payamId: '',
          bomaId: '',
        });
      }
    }).catch(err => {
      console.error(err);
      this.countyList = [];
    });
  }

  getPayamLookupByCountyId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const countyId = target.value;
    this.apiService.POST('api/lookup/search', { 
      lookupType: "PAYAM", 
      parentId: (countyId !== '-1') ? countyId : "", 
      size: -1 
    }).then(res => {
      if (res.status === 200) {
        this.payamList = res.data.lookups;
        this.bomaList = [];
        this.reportForm.patchValue({
          payamId: '',
          bomaId: '',
        });
      }
    }).catch(err => {
      console.error(err);
      this.payamList = [];
    });
  }

  getBomaLookupByPayamId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const payamId = target.value;
    this.apiService.POST('api/lookup/search', { 
      lookupType: "BOMA", 
      parentId: (payamId !== '-1') ? payamId : "", 
      size: -1 
    }).then(res => {
      if (res.status === 200) {
        this.bomaList = res.data.lookups;
        this.reportForm.patchValue({
          bomaId: '',
        });
      }
    }).catch(err => {
      console.error(err);
      this.bomaList = [];
    });
  }

  determineEndpoint = (): string => {
    let endpoint = '';
    switch (this.selectedReportTypeId) {
      case 1:
        endpoint = 'api/report/household-report';
        break;
      case 2:
        endpoint = 'api/report/staff-report';
        break;
      case 3:
        endpoint = '';
        break;
      case 4:
        endpoint = 'api/report/household-report';
        break;
      case 5:
        endpoint = 'api/report/age-group-report';
        break;
      case 6:
        endpoint = 'api/report/household-component2-report';
        break;
      case 7:
        endpoint = 'api/report/afis-match-report';
        break;
      case 8:
        endpoint = 'api/report/file-based-report';
        break;
      case 9:
        endpoint = 'api/report/reconciled-summary-report';
        break;
      case 10:
        endpoint = 'api/report/reconciliation-summary-count-report';
        break;
    }
    return endpoint;
  }

  determineReportResultRenderObject = (data: any): void => {
    switch (this.selectedReportTypeId) {
      case 1:
        this.reportBeneficiaryListResult = data;
        break;
      case 2:
        this.reportStaffWiseBeneficiaryCountResult = data;
        break;
      case 3:
        this.reportBeneficiaryListResult = data;
        break;
      case 4:
        this.reportBeneficiaryListResult = data;
        break;
      case 5:
        this.reportAgeGroupGenderWiseCountResult = data;
        break;
      case 6:
        this.reportLocationWiseNomineeCount = data;
        break;
      case 7:
        this.reportMatchListResult = data;
        break;
      case 8:
        this.reportHouseholdSurvery = data;
        break;
      case 9:
        this.reportReconciledSummaryResult = data;
        this.reportReconciledSummaryTotals = data;
        break;
      case 10:
        this.reportReconciliationSummaryCount = data;
        break;
    }
  }

  generateReport = (): void => {
    this.isReportGenerating = true;
    const endpoint = this.determineEndpoint();

    if (this.selectedReportTypeId === 9) {
      const payloadForReport = {
        state: parseInt(this.reportForm.value.stateId) || null,
        county: parseInt(this.reportForm.value.countyId) || null,
        payam: parseInt(this.reportForm.value.payamId) || null,
        boma: parseInt(this.reportForm.value.bomaId) || null,
        scheme: this.reportForm.value.scheme || null,
        paymentStatus: this.reportForm.value.paymentStatus || null,
        size: this.reportForm.value.size || null,
        paymentCycle: this.reportForm.value.paymentCycle ? parseInt(this.reportForm.value.paymentCycle, 10) : null
      };
      
      this.reportReconciledSummaryTotals = {
        totalBeneficiaries: 0,
        totalPaid: 0,
        totalUnpaid: 0,
      };

      this.apiService.POST(endpoint, payloadForReport)
        .then((res: any) => {
          console.log('Full API Response Data:', res.data);

          if (res.status === 200 && res.data) {
            const beneficiaries = res?.data?.data?.beneficiaries ?? [];

            this.reportReconciledSummaryResult = beneficiaries.map((beneficiary: any) => ({
              householdNumber: beneficiary.householdNumber,
              name: `${beneficiary.firstName} ${beneficiary.lastName} ${beneficiary.surName}`.trim(),
              enrolmentNumber: beneficiary.enrolmentNumber,
              wage: beneficiary.wage,
              supportType: beneficiary.supportType === 1 ? "DIS" : "LIPW",
              reqNo: beneficiary.reqNo,
              paymentCycle: beneficiary.paymentCycle,
              paymentCenter: beneficiary.paymentCenter,
              status: beneficiary.status,
            }));
            
            this.reportReconciledSummaryTotals = {
              totalBeneficiaries: res?.data?.data?.totalBeneficiaries ?? 0,
              totalPaid: res?.data?.data?.totalPaid ?? 0,
              totalUnpaid: res?.data?.data?.totalUnpaid ?? 0,
            };

            console.log('Mapped Data:', this.reportReconciledSummaryResult);
            console.log('Summary Totals:', this.reportReconciledSummaryTotals);
          } else {
            this.reportReconciledSummaryResult = [];
          }
          this.isReportGenerating = false;
        })
        .catch((err: any) => {
          console.error('Error calling reconciled-summary-report API:', err.response?.data || err.message);
          this.reportReconciledSummaryResult = [];
          this.isReportGenerating = false;
        });
      return;
    }

    if (this.selectedReportTypeId === 10) {
      const payloadForReport = {
        state: parseInt(this.reportForm.value.stateId) || null,
        county: parseInt(this.reportForm.value.countyId) || null,
        payam: parseInt(this.reportForm.value.payamId) || null,
        boma: parseInt(this.reportForm.value.bomaId) || null,
        paymentCycle: this.reportForm.value.paymentCycle ? parseInt(this.reportForm.value.paymentCycle, 10) : null
      };

      this.apiService.POST(endpoint, payloadForReport)
        .then((res: any) => {
          console.log('Full API Response Data for Case 10:', res.data);

          if (res.status === 200 && res.data) {
            const dataLists = res?.data?.dataList ?? [];

            this.reportReconciliationSummaryCount = dataLists.map((dataList: any) => ({
              boma: dataList.boma,
              totalDISApproved: dataList.totalDISApproved,
              totalLIPWApproved: dataList.totalLIPWApproved,
              totalDISPaid: dataList.totalDISPaid,
              totalDISUnpaid: dataList.totalDISUnpaid,
              totalLIPWPaid: dataList.totalLIPWPaid,
              totalLIPWUnpaid: dataList.totalLIPWUnpaid,
            }));
          } else {
            this.reportReconciliationSummaryCount = [];
          }
          this.isReportGenerating = false;
        })
        .catch((err: any) => {
          console.error('Error calling reconciliation-summary-count API:', err.response?.data || err.message);
          this.reportReconciliationSummaryCount = [];
          this.isReportGenerating = false;
        });

      return;
    }

    if (this.reportForm.value.staffUserName) {
      this.reportForm.value.fromDate = this.formatDateToDDMMYYYY(this.reportForm.value.fromDate);
      this.reportForm.value.toDate = this.formatDateToDDMMYYYY(this.reportForm.value.toDate);
    }

    if (endpoint === "api/report/afis-match-report") {
      this.reportForm.value.size = -1;
    }

    if (this.selectedReportTypeId === 8) {
      this.apiService.GET(endpoint).then(res => {
        if (res.status === 200) {
          this.determineReportResultRenderObject(res.data);
        } else {
          this.determineReportResultRenderObject(null);
        }
        this.isReportGenerating = false;
      }).catch(err => {
        console.error(err);
        this.determineReportResultRenderObject(null);
        this.isReportGenerating = false;
      });
    } else {
      this.apiService.POST(endpoint, this.reportForm.value).then(res => {
        if (res.status === 200) {
          this.determineReportResultRenderObject(res.data);
        } else {
          this.determineReportResultRenderObject(null);
        }
        this.isReportGenerating = false;
      }).catch(err => {
        console.error(err);
        this.determineReportResultRenderObject(null);
        this.isReportGenerating = false;
      });
    }
  }

  resetForm(form: FormGroup): void {
    this.showReportForm(this.selectedReportTypeId, this.selectedReportTypeTitle);
  }

  private formatDateToDDMMYYYY(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  private parseDateFromDDMMYYYY(date: string): string {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  ngOnInit(): void {
    this.items = [{ label: 'Report', icon: 'fas fa-chart-line me-2' }];
  this.home = { label: '', icon: 'fas fa-home me-2', routerLink: '/' };
  this.isLoading = false;

  // If user came via /report/details or /report/summary, fire the right form
  this.route.data.subscribe((d: Data) => {
    const t = d['reportType'];
    const title = d['reportTitle'];
    if (t && title) {
      // hide options and show targeted form
      this.reportOptions = false;
      this.showReportForm(t, title);
    }
  });
    this.items = [{ label: 'Report', icon: 'fas fa-chart-line me-2' }];
    this.home = { 
      label: '', 
      icon: 'fas fa-home me-2', 
      routerLink: '/' 
    };
    this.isLoading = false;
  }
}