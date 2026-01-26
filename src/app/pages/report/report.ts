import { ReportTotalBeneficiaryPaymentDetails } from './../report-list/report-total-beneficiary-payment-details/report-total-beneficiary-payment-details';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ApiService } from '../../services/api.service';
import { LookupItem, LookupService } from '../../services/lookup.service';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';
import { Loader } from '../../components/loader/loader';
import { ReportBeneficiaryList } from '../report-list/report-beneficiary-list/report-beneficiary-list';
import { ReportStaffWiseBeneficiaryCount } from '../report-list/report-staff-wise-beneficiary-count/report-staff-wise-beneficiary-count';
import { ReportAgeGroupGenderWiseBeneficiaryCount } from '../report-list/report-age-group-gender-wise-beneficiary-count/report-age-group-gender-wise-beneficiary-count';
import { ReportMatchList } from '../report-list/report-match-list/report-match-list';
import { ReportLocationWiseNomineeCount } from '../report-list/report-location-wise-nominee-count/report-location-wise-nominee-count';
import { ReportCompleteHouseholdSurvey } from '../report-list/report-complete-household-survey/report-complete-household-survey';
import { ReportReconciledSummaryResult } from '../report-list/report-reconciled-summary-result/report-reconciled-summary-result';
import { ReportReconciliationSummaryCount } from '../report-list/report-reconciliation-summary-count/report-reconciliation-summary-count';
import { Button } from 'primeng/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BreadcrumbModule,
    LoadingSpinner,
    Loader,
    ReportBeneficiaryList,
    ReportStaffWiseBeneficiaryCount,
    ReportAgeGroupGenderWiseBeneficiaryCount,
    ReportMatchList,
    ReportLocationWiseNomineeCount,
    ReportCompleteHouseholdSurvey,
    ReportReconciledSummaryResult,
    ReportReconciliationSummaryCount,
    Button,
    FloatLabelModule,
    SelectModule,
    MultiSelectModule,
    ReportTotalBeneficiaryPaymentDetails,
  ],
  templateUrl: './report.html',
  styleUrls: ['./report.scss'],
})
export class ReportComponent implements OnInit {
  states: LookupItem[] = [];
  counties: LookupItem[] = [];
  payams: LookupItem[] = [];
  bomas: LookupItem[] = [];

  genderOptions: LookupItem[] = [];
  registrationPhaseOptions: LookupItem[] = [];
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
  reportReconciledSummaryResultCount: any = null;
  reportReconciledSummaryTotals = {
    totalBeneficiaries: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  };
  reportReconciliationSummaryCount: any = null;
  reportMatchListResult: any = null;
  reportTotalBeneficiaryPaymentDetails: any = null;
  reportTotalBeneficiaryPaymentDetailsTotals = {
    totalBeneficiaries: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  };

  date: Date[] | undefined;
  reportForm: FormGroup = new FormGroup({});
  paymentCyclesAvailable = Array.from({ length: 15 }, (_, i) => ({
    label: `Payment Cycle ${i + 1}`,
    value: i + 1
  }));


  constructor(
    private apiService: ApiService,
    public lookupService: LookupService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  showReportForm = (reportType: number, reportTitle: string): void => {
    // Reset all report results
    this.reportBeneficiaryListResult = null;
    this.reportStaffWiseBeneficiaryCountResult = null;
    this.reportAgeGroupGenderWiseCountResult = null;
    this.reportMatchListResult = null;
    this.reportLocationWiseNomineeCount = null;
    this.reportHouseholdSurvery = null;
    this.reportReconciledSummaryResultCount = null;
    this.reportReconciliationSummaryCount = null;
    this.reportTotalBeneficiaryPaymentDetails = null;

    switch (reportType) {
      case 1:
        this.reportForm = new FormGroup({
          size: new FormControl(10, Validators.required),
          from: new FormControl(0, Validators.required),
          stateId: new FormControl(''),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          registrationPhase: new FormControl(''),
        });
        break;
      case 2:
        this.getStaffList();
        this.reportForm = new FormGroup({
          fromDate: new FormControl('', Validators.required),
          toDate: new FormControl('', Validators.required),
          staffUserName: new FormControl('', Validators.required),
          registrationPhase: new FormControl(''),
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
          registrationPhase: new FormControl(''),
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
          registrationPhase: new FormControl(''),
        });
        break;
      case 7:
        this.reportForm = new FormGroup({
          page: new FormControl(0, Validators.required),
          registrationPhase: new FormControl(''),
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
          criteria: new FormControl('ALL', Validators.required),
          paymentStatus: new FormControl('ALL', Validators.required),
          size: new FormControl(1000, Validators.required),
          paymentCycle: new FormControl('1', Validators.required),
        });
        break;
      case 10:
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl('', Validators.required),
          payamId: new FormControl('', Validators.required),
          bomaId: new FormControl(''),
          paymentCycle: new FormControl('1', Validators.required),
        });
        break;
      case 11:
        this.reportForm = new FormGroup({
          stateId: new FormControl('', Validators.required),
          countyId: new FormControl(''),
          payamId: new FormControl(''),
          bomaId: new FormControl(''),
          criteria: new FormControl('ALL'),
          paymentStatus: new FormControl('ALL'),
          size: new FormControl(-1, Validators.required),
          paymentCycle: new FormControl('1', Validators.required),
          paymentCycleSelectionType: new FormControl('single'),
          paymentCycles: new FormControl([]),
        });

        this.reportForm
          .get('paymentCycleSelectionType')
          ?.valueChanges.subscribe((val) => {
            if (val === 'single') {
              this.reportForm
                .get('paymentCycle')
                ?.setValidators([Validators.required]);
              this.reportForm.get('paymentCycles')?.clearValidators();
              this.reportForm.get('paymentCycles')?.setValue([]);
            } else {
              this.reportForm.get('paymentCycle')?.clearValidators();
              this.reportForm
                .get('paymentCycles')
                ?.setValidators([Validators.required]);
            }
            this.reportForm.get('paymentCycle')?.updateValueAndValidity();
            this.reportForm.get('paymentCycles')?.updateValueAndValidity();
          });
        break;
      default:
        this.reportForm.reset();
        break;
    }
    this.selectedReportTypeId = reportType;
    this.selectedReportTypeTitle = reportTitle;
    this.reportOptions = false;
  };

  getStaffList = (): void => {
    const payload = {
      page: 0,
      size: 500,
      sortColumn: 'ID',
      sortOrder: 'DESC',
    };
    this.apiService
      .POST_AUTH('api/users/search', payload)
      .then((res) => {
        if (res.status === 200) {
          this.userList = res.data.users;
        }
      })
      .catch((err) => {
        console.error(err);
        this.userList = [];
      });
  };

  getCountyLookupByStateId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const stateId = target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'COUNTY',
        parentId: stateId !== '-1' ? stateId : '',
        size: -1,
      })
      .then((res) => {
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
      })
      .catch((err) => {
        console.error(err);
        this.countyList = [];
      });
  };

  getPayamLookupByCountyId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const countyId = target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'PAYAM',
        parentId: countyId !== '-1' ? countyId : '',
        size: -1,
      })
      .then((res) => {
        if (res.status === 200) {
          this.payamList = res.data.lookups;
          this.bomaList = [];
          this.reportForm.patchValue({
            payamId: '',
            bomaId: '',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        this.payamList = [];
      });
  };

  getBomaLookupByPayamId = (evt: Event): void => {
    const target = evt.target as HTMLSelectElement;
    const payamId = target.value;
    this.apiService
      .POST('api/lookup/geo/search', {
        lookupType: 'BOMA',
        parentId: payamId !== '-1' ? payamId : '',
        size: -1,
      })
      .then((res) => {
        if (res.status === 200) {
          this.bomaList = res.data.lookups;
          this.reportForm.patchValue({
            bomaId: '',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        this.bomaList = [];
      });
  };

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
      case 11:
        endpoint = 'api/report/total-beneficiaries-payment-report';
        break;
    }
    return endpoint;
  };

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
        this.reportReconciledSummaryResultCount = data;
        this.reportReconciledSummaryTotals = data;
        break;
      case 10:
        this.reportReconciliationSummaryCount = data;
        break;
      case 11:
        this.reportTotalBeneficiaryPaymentDetails = data;
        this.reportTotalBeneficiaryPaymentDetailsTotals = data;
        break;
    }
  };
  generateReport = (): void => {
    this.isReportGenerating = true;
    const endpoint = this.determineEndpoint();

    if (this.selectedReportTypeId === 9) {
      const payloadForReport = {
        state: parseInt(this.reportForm.value.stateId) || null,
        county: parseInt(this.reportForm.value.countyId) || null,
        payam: parseInt(this.reportForm.value.payamId) || null,
        boma: parseInt(this.reportForm.value.bomaId) || null,
        criteria: this.reportForm.value.criteria || null,
        paymentStatus: this.reportForm.value.paymentStatus || null,
        size: this.reportForm.value.size || null,
        paymentCycle: this.reportForm.value.paymentCycle
          ? parseInt(this.reportForm.value.paymentCycle, 10)
          : null,
      };

      this.reportReconciledSummaryTotals = {
        totalBeneficiaries: 0,
        totalPaid: 0,
        totalUnpaid: 0,
      };

      this.apiService
        .POST(endpoint, payloadForReport)
        .then((res: any) => {
          console.log('Full API Response Data:', res.data);

          if (res.status === 200 && res.data) {
            const beneficiaries = res?.data?.reportData?.beneficiaries ?? [];

            this.reportReconciledSummaryResultCount = beneficiaries.map(
              (beneficiary: any) => ({
                householdNumber: beneficiary.householdNumber,
                name: `${beneficiary.firstName} ${beneficiary.middleName} ${beneficiary.lastName}`.trim(),
                wage: beneficiary.wageSspTotal,
                supportType: beneficiary.criteria,
                reqNo: beneficiary.requestNumber,
                paymentCycle: beneficiary.paymentCycle,
                paymentCenter: beneficiary.paymentCenter ?? 'N/A',
                status: beneficiary.paymentStatus,
                exchangeRate: beneficiary.exchangeRate,
                paymentDate: beneficiary.paymentDate
                  ? beneficiary.paymentDate
                  : 'N/A',
              })
            );

            this.reportReconciledSummaryTotals = {
              totalBeneficiaries:
                res?.data?.reportData?.totalBeneficiaries ?? 0,
              totalPaid: res?.data?.reportData?.totalPaid ?? 0,
              totalUnpaid: res?.data?.reportData?.totalUnpaid ?? 0,
            };

            console.log(
              'Mapped Data:',
              this.reportReconciledSummaryResultCount
            );
            console.log('Summary Totals:', this.reportReconciledSummaryTotals);
          } else {
            this.reportReconciledSummaryResultCount = [];
          }
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        })
        .catch((err: any) => {
          console.error(
            'Error calling reconciled-summary-report API:',
            err.response?.data || err.message
          );
          this.reportReconciledSummaryResultCount = [];
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        });

      return;
    }

    if (this.selectedReportTypeId === 11) {
      let paymentCycle: number[] = [];
      if (this.reportForm.value.paymentCycleSelectionType === 'single') {
        paymentCycle = [parseInt(this.reportForm.value.paymentCycle, 10)];
      } else {
        paymentCycle = this.reportForm.value.paymentCycles;
      }
      const payloadForReport = {
        state: parseInt(this.reportForm.value.stateId) || null,
        county: parseInt(this.reportForm.value.countyId) || null,
        payam: parseInt(this.reportForm.value.payamId) || null,
        boma: parseInt(this.reportForm.value.bomaId) || null,
        criteria: this.reportForm.value.criteria || null,
        paymentStatus: this.reportForm.value.paymentStatus || null,
        size: this.reportForm.value.size || null,
        paymentCycles: paymentCycle,
      };

      this.reportTotalBeneficiaryPaymentDetailsTotals = {
        totalBeneficiaries: 0,
        totalPaid: 0,
        totalUnpaid: 0,
      };

      this.apiService
        .POST(endpoint, payloadForReport)
        .then((res: any) => {
          console.log('Full API Response Data:', res.data);

          if (res.status === 200 && res.data) {
            const beneficiaries = res.data?.data ?? [];

            this.reportTotalBeneficiaryPaymentDetails = beneficiaries.map(
              (beneficiary: any) => ({
                householdNumber: beneficiary.householdNumber,
                name: beneficiary.beneficiaryName,
                gender: beneficiary.gender,
                state: beneficiary.state,
                county: beneficiary.county,
                payam: beneficiary.payam,
                boma: beneficiary.boma,
                workCode: beneficiary.workCode,
                supportType: beneficiary.component,
                reqNo: beneficiary.wageRequestNumber,
                paymentCycle: beneficiary.paymentCycle,
                paymentCenter: beneficiary.payStatus ?? 'N/A',
                status: beneficiary.payStatus,
                exchangeRate: beneficiary.exchangeRateSsp,
                wageRateUsd: beneficiary.wageRateUsd,
                paidAmountUsd: beneficiary.paidAmountUsd,
                paidAmountSsp: beneficiary.paidAmountSsp,
                attendanceDays: beneficiary.attendanceDays,
                absenceDays: beneficiary.absenceDays,
                paymentDate: beneficiary.paymentDate
                  ? beneficiary.paymentDate
                  : 'N/A',
                paymentGenerateDate: beneficiary.paymentGenerateDate,
                fromDate: beneficiary.fromDate,
                toDate: beneficiary.toDate,
                paidHouseHoldName: beneficiary.paidHouseHoldName,
                paidTo: beneficiary.paidTo,
                latitude: beneficiary.latitude,
                longitude: beneficiary.longitude,
              })
            );

            this.reportTotalBeneficiaryPaymentDetailsTotals = {
              totalBeneficiaries:
                res?.data?.metadata?.totalBeneficiaries ?? 0,
              totalPaid: res?.data?.metadata?.totalPaid ?? 0,
              totalUnpaid: res?.data?.metadata?.totalUnpaid ?? 0,
            };

            console.log(
              'Mapped Data:',
              this.reportTotalBeneficiaryPaymentDetails
            );
            console.log(
              'Summary Totals:',
              this.reportTotalBeneficiaryPaymentDetailsTotals
            );
          } else {
            this.reportTotalBeneficiaryPaymentDetails = [];
          }
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        })
        .catch((err: any) => {
          console.error(
            'Error calling reconciled-summary-report API:',
            err.response?.data || err.message
          );
          this.reportTotalBeneficiaryPaymentDetails = [];
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        });

      return;
    }

    if (this.selectedReportTypeId === 10) {
      const payloadForReport = {
        state: parseInt(this.reportForm.value.stateId) || null,
        county: parseInt(this.reportForm.value.countyId) || null,
        payam: parseInt(this.reportForm.value.payamId) || null,
        boma: parseInt(this.reportForm.value.bomaId) || null,
        paymentCycle: this.reportForm.value.paymentCycle
          ? parseInt(this.reportForm.value.paymentCycle, 10)
          : null,
      };

      this.apiService
        .POST(endpoint, payloadForReport)
        .then((res: any) => {
          console.log('Full API Response Data for Case 10:', res.data);

          if (res.status === 200 && res.data) {
            const dataLists = res?.data?.dataList ?? [];
            const data = res?.data ?? [];

            this.reportReconciliationSummaryCount = dataLists.map(
              (dataList: any) => ({
                boma: dataList.boma,
                totalDISApproved: dataList.totalDISApproved,
                totalLIPWApproved: dataList.totalLIPWApproved,
                totalDISPaid: dataList.totalDISPaid,
                totalDISUnpaid: dataList.totalDISUnpaid,
                totalLIPWPaid: dataList.totalLIPWPaid,
                totalLIPWUnpaid: dataList.totalLIPWUnpaid,
                state: data.state,
                county: data.county,
                payam: data.payam,
              })
            );
          } else {
            this.reportReconciliationSummaryCount = [];
          }
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        })
        .catch((err: any) => {
          console.error(
            'Error calling reconciliation-summary-count API:',
            err.response?.data || err.message
          );
          this.reportReconciliationSummaryCount = [];
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        });

      return;
    }

    if (this.reportForm.value.staffUserName) {
      this.reportForm.value.fromDate = this.formatDateToDDMMYYYY(
        this.reportForm.value.fromDate
      );
      this.reportForm.value.toDate = this.formatDateToDDMMYYYY(
        this.reportForm.value.toDate
      );
    }

    if (endpoint === 'api/report/afis-match-report') {
      this.reportForm.value.size = -1;
    }

    if (this.selectedReportTypeId === 8) {
      this.apiService
        .GET(endpoint)
        .then((res) => {
          if (res.status === 200) {
            this.determineReportResultRenderObject(res.data);
          } else {
            this.determineReportResultRenderObject(null);
          }
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        })
        .catch((err) => {
          console.error(err);
          this.determineReportResultRenderObject(null);
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        });
    } else {
      this.apiService
        .POST(endpoint, this.reportForm.value)
        .then((res) => {
          if (res.status === 200) {
            this.determineReportResultRenderObject(res.data);
          } else {
            this.determineReportResultRenderObject(null);
          }
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        })
        .catch((err) => {
          console.error(err);
          this.determineReportResultRenderObject(null);
          this.isReportGenerating = false;
          this.cdr.markForCheck(); // Added here
        });
    }
    this.cdr.markForCheck(); // Added here
  };

  resetForm(form: FormGroup): void {
    this.showReportForm(
      this.selectedReportTypeId,
      this.selectedReportTypeTitle
    );
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
    Promise.all([
      this.lookupService.getOrFetchStateList(),
      this.lookupService.fetchAllCountyList(),
      this.lookupService.fetchAllPayamList(),
      this.lookupService.fetchAllBomaList(),
    ]).then(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
    });
    this.home = {
      label: '',
      icon: 'fas fa-home me-2',
      routerLink: '/',
    };
    this.isLoading = false;

    this.route.data.subscribe((data) => {
      const reportType = data['reportType'];
      const reportTitle = data['reportTitle'];
      if (reportType && reportTitle) {
        this.items = [{ label: reportTitle, icon: 'fas fa-chart-line me-2' }];
        this.showReportForm(reportType, reportTitle);
      }
    });
  }
  showUnderConstruction() {
    this.router.navigate(['under-construction']);
  }
}
