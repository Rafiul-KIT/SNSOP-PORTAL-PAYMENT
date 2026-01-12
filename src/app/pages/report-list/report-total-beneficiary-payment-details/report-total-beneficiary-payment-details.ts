import { Component, inject, Input, input, OnInit } from '@angular/core';

import { saveAs } from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { LookupService } from '../../../services/lookup.service';

interface ReconciledSummaryRow {
  householdNumber: string;
  name: string;
  wage: number;
  supportType: string;
  reqNo: string;
  exchangeRate: string;
  paymentDate: string;
  paymentCycle: string;
  paymentCenter: string;
  status: string;
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
    doc.text('Reconciled Summary Result Report', 14, 20);

    // Add summary totals
    doc.setFontSize(10);
    const summaryText = `Total Beneficiaries: ${
      this.reportTotalBeneficiaryPaymentDetailsTotals.totalPaid +
      this.reportTotalBeneficiaryPaymentDetailsTotals.totalUnpaid
    } | Total Paid: ${
      this.reportTotalBeneficiaryPaymentDetailsTotals.totalPaid
    } | Total Unpaid: ${this.reportTotalBeneficiaryPaymentDetailsTotals.totalUnpaid}`;
    doc.text(summaryText, 14, 30);

    const headers = [
      'HH Number',
      'Name',
      'Wage',
      'Ex Rate',
      'Pay Date',
      'Supp Type',
      'Req No',
      'Pay Cycle',
      'Pay Center',
      'Status',
    ];

    const data = this.reportTotalBeneficiaryPaymentDetails.map(
      (row: ReconciledSummaryRow) => [
        row.householdNumber,
        row.name,
        `SSP ${row.wage}`,
        row.exchangeRate,
        row.paymentDate,
        row.supportType,
        row.reqNo,
        `Payment Cycle ${row.paymentCycle}`,
        row.paymentCenter || 'N/A',
        row.status,
      ]
    );

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
        fontSize: 8,
        cellPadding: 2,
      },
    });

    doc.save('TotalBeneficiaryPaymentDetails.pdf');
  }

  async exportExcel() {
     if (!this.reportTotalBeneficiaryPaymentDetails || this.reportTotalBeneficiaryPaymentDetails.length === 0) {
      console.error('No data available to export.');
      return;
    }

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(this.reportTotalBeneficiaryPaymentDetails);

    // Adjust column widths
    const columnWidths = [
      { wch: 45 }, // Household Number
      { wch: 25 }, // Name
      { wch: 10 }, // Wage
      { wch: 10 }, //exchange rate
      { wch: 10 }, // payment date
      { wch: 10 }, // Support Type
      { wch: 20 }, // Request Number
      { wch: 20 }, // Payment Cycle
      { wch: 15 }, // Payment Center
      { wch: 10 }, // Status
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
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Total Beneficiary Payment Details');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'TotalBeneficiaryPaymentDetails.xlsx');
  }
}
