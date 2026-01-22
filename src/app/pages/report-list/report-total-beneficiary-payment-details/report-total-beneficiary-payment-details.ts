import { Component, inject, Input, input, OnInit } from '@angular/core';

import { saveAs } from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { LookupService } from '../../../services/lookup.service';

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
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule],
  templateUrl: './report-total-beneficiary-payment-details.html',
  styleUrl: './report-total-beneficiary-payment-details.scss'
})
export class ReportTotalBeneficiaryPaymentDetails implements OnInit {


  @Input() reportTotalBeneficiaryPaymentDetails: any;
  @Input() reportTotalBeneficiaryPaymentDetailsTotals: {
    totalBeneficiaries: number;
    totalPaid: number;
    totalUnpaid: number;
  } = { totalBeneficiaries: 0, totalPaid: 0, totalUnpaid: 0 };

  constructor(public lookupService: LookupService) {}


  ngOnInit(): void {
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

  async exportExcel() {
    if (
      !this.reportTotalBeneficiaryPaymentDetails ||
      this.reportTotalBeneficiaryPaymentDetails.length === 0
    ) {
      console.error('No data available to export.');
      return;
    }

    const dataToExport = this.reportTotalBeneficiaryPaymentDetails.map(
      (row: any, index: number) => ({
        'S.No': index + 1,
        'State Name': row.state,
        'County Name': row.county,
        'Payam Name': row.payam,
        'Boma Name': row.boma,
        'Work Code': row.workCode,
        'Benficiary Name': row.name,
        'Household number': row.householdNumber,
        'Component': row.supportType,
        'Wage Rate (In USD)': row.wageRateUsd,
        'Paid Amount (In USD)': row.paidAmountUsd,
        'Attendance Days': row.attendanceDays,
        'Absence Days': row.absenceDays,
        'Exchange Rate In SSP': row.exchangeRate,
        'Paid Amount (In SSP)': row.paidAmountSsp,
        'Payment Date': row.paymentDate,
        'Payment Generate Date': row.paymentGenerateDate,
        'Paidto': row.paidTo,
        'Pay Status': row.status,
        'Wage Request Number': row.reqNo,
        'Payment Cycle': 'Payment Cycle ' + row.paymentCycle,
      })
    );

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);

    // Adjust column widths
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 10 },  // IP
      { wch: 15 },  // State Name
      { wch: 15 },  // County Name
      { wch: 15 },  // Payam Name
      { wch: 15 },  // Boma Name
      { wch: 15 },  // Work Code
      { wch: 25 },  // Benficiary Name
      { wch: 25 },  // Original Household number
      { wch: 15 },  // Component
      { wch: 20 },  // Wage Rate (In USD)
      { wch: 20 },  // Paid Amount (In USD)
      { wch: 15 },  // Attendance Days
      { wch: 15 },  // Absence Days
      { wch: 20 },  // Exchange Rate In SSP
      { wch: 20 },  // Paid Amount (In SSP)
      { wch: 15 },  // Payment Date
      { wch: 25 },  // Payment Generate Date
      { wch: 15 },  // Paidto
      { wch: 10 },  // Pay Status
      { wch: 20 },  // Wage Request Number
      { wch: 15 },  // Payment Cycle
    ];
    worksheet['!cols'] = columnWidths;

    const range = xlsx.utils.decode_range(worksheet['!ref'] || '');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          if (!cell.s) cell.s = {};
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        }
      }
    }

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(
      workbook,
      worksheet,
      'Beneficiary Payment Details'
    );
    const excelBuffer = xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true,
    });
    const data = new Blob([excelBuffer], {
      type: 'application/octet-stream',
    });
    saveAs(data, 'TotalBeneficiaryPaymentDetails.xlsx');
  }
}
