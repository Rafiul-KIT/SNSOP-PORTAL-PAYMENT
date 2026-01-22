import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';

import { saveAs } from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { LookupService } from '../../../services/lookup.service';
import { Loader } from '../../../components/loader/loader';

interface ReconciledSummaryRow {
  state: string;
  county: string;
  payam: string;
  boma: string;
  householdNumber: string;
  name: string;
  wage: number;
  exchangeRate: number;
  supportType: string;
  reqNo: string;
  paymentCycle: string;
  workCode: string;
  wageRateUsd: number;
  paidAmountUsd: number;
  attendanceDays: number;
  absenceDays: number;
  paymentGenerateDate: string;
  paymentDate: string;
  paidHouseHoldName: string;
  paidTo: string;
  status: string;
  paymentCenter: string;
}

interface SummaryTotals {
  totalBeneficiaries: number;
  totalPaid: number;
  totalUnpaid: number;
}


@Component({
  selector: 'app-report-total-beneficiary-payment-details',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule, Loader],
  templateUrl: './report-total-beneficiary-payment-details.html',
  styleUrl: './report-total-beneficiary-payment-details.scss'
})
export class ReportTotalBeneficiaryPaymentDetails implements OnInit, OnChanges {

  @Input() reportTotalBeneficiaryPaymentDetails: any;
  @Input() reportTotalBeneficiaryPaymentDetailsTotals: {
    totalBeneficiaries: number;
    totalPaid: number;
    totalUnpaid: number;
  } = { totalBeneficiaries: 0, totalPaid: 0, totalUnpaid: 0 };
  @Input() isLoading: boolean = true;

  isExporting: boolean = false;

  constructor(public lookupService: LookupService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportTotalBeneficiaryPaymentDetails'] && this.reportTotalBeneficiaryPaymentDetails) {
      this.isLoading = false;
    }
  }

  async exportPdf() {
    if (
      !this.reportTotalBeneficiaryPaymentDetails ||
      this.reportTotalBeneficiaryPaymentDetails.length === 0
    ) {
      console.error('No data available to export.');
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('landscape');

    // Add title
    doc.setFontSize(18);
    doc.text('Total Beneficiary Payment Details Report', 14, 20);

    // Add summary totals
    doc.setFontSize(10);
    const summaryText = `Total Beneficiaries: ${
      this.reportTotalBeneficiaryPaymentDetailsTotals.totalBeneficiaries
    } | Total Paid: ${
      this.reportTotalBeneficiaryPaymentDetailsTotals.totalPaid
    } | Total Unpaid: ${this.reportTotalBeneficiaryPaymentDetailsTotals.totalUnpaid}`;
    doc.text(summaryText, 14, 30);

    const headers = [
      'State',
      'County',
      'Payam',
      'Boma',
      'HH Number',
      'Name',


      'Supp Type',
      'Req No',
      'Pay Cycle',
      'Work Code',
      'Wage Rate (USD)',
       'Ex Rate(SSP)',
      'Paid Amount (USD)',
      'Attd. Days',
      'Abs. Days',
      'Pay Gen Date',
      'Pay Date',

      'Paid To',
      'Status',
    ];

    const data = this.reportTotalBeneficiaryPaymentDetails.map((row: any) => [
      row.state,
      row.county,
      row.payam,
      row.boma,
      row.householdNumber,
      row.name,


      row.supportType,
      row.reqNo,
      `PC ${row.paymentCycle}`,
      row.workCode,
      row.wageRateUsd,
       row.exchangeRate,
      row.paidAmountUsd,
      row.attendanceDays,
      row.absenceDays,
      row.paymentGenerateDate,
      row.paymentDate,

      row.paidTo,
      row.status,
    ]);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255],
      },
      styles: {
        fontSize: 7,
        cellPadding: 1,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 20 },
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' },
        8: { cellWidth: 'auto' },
        9: { cellWidth: 'auto' },
        10: { cellWidth: 'auto' },
        11: { cellWidth: 'auto' },
        12: { cellWidth: 'auto' },
        13: { cellWidth: 'auto' },
        14: { cellWidth: 'auto' },
        15: { cellWidth: 'auto' },
        16: { cellWidth: 'auto' },
        17: { cellWidth: 'auto' },
        18: { cellWidth: 20 },
        19: { cellWidth: 'auto' },
        20: { cellWidth: 'auto' },
      },
    });

    doc.save('TotalBeneficiaryPaymentDetails.pdf');
  }

  exportExcel() {
    if (
      !this.reportTotalBeneficiaryPaymentDetails ||
      this.reportTotalBeneficiaryPaymentDetails.length === 0
    ) {
      console.error('No data available to export.');
      return;
    }

    this.isExporting = true;

    try {
      const headers = [
        'S.No',
        'State Name',
        'County Name',
        'Payam Name',
        'Boma Name',
        'Work Code',
        'Beneficiary Name',
        'Household Number',
        'Gender',
        'Support Type',
        'Wage Rate (In USD)',
        'Paid Amount (In USD)',
        'Attendance Days',
        'Absence Days',
        'Exchange Rate In SSP',
        'Total Amount (In SSP)',
        'Payment Date',
        'Payment Generate Date',
        'Paid To',
        'Pay Status',
        'Wage Request Number',
        'Payment Cycle'
      ];

      const csvRows: string[] = [];
      csvRows.push(headers.map(h => `"${h}"`).join(','));

      this.reportTotalBeneficiaryPaymentDetails.forEach((row: any, index: number) => {
        const values = [
          index + 1,
          row.state || '',
          row.county || '',
          row.payam || '',
          row.boma || '',
          row.workCode || '',
          row.name || '',
          row.householdNumber || '',
          row.gender || '',
          row.supportType || '',
          row.wageRateUsd || '',
          row.paidAmountUsd || '',
          row.attendanceDays || '',
          row.absenceDays || '',
          row.exchangeRate || '',
          row.paidAmountSsp || '',
          row.paymentDate || '',
          row.paymentGenerateDate || '',
          row.paidTo || '',
          row.status || '',
          row.reqNo || '',
          'Payment Cycle ' + (row.paymentCycle || '')
        ];
        csvRows.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'TotalBeneficiaryPaymentDetails.csv');
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }
}
