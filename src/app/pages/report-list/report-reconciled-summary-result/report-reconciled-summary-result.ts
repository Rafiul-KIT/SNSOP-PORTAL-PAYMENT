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
  enrolmentNumber: string;
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
  selector: 'app-report-reconciled-summary-result',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule], // Import PrimeNG modules and CurrencyPipe
  templateUrl: './report-reconciled-summary-result.html',
  styleUrls: ['./report-reconciled-summary-result.scss'],
})
export class ReportReconciledSummaryResult implements OnInit {


  @Input() reportReconciledSummaryResultCount: any;
  @Input() reportReconciledSummaryTotals: {
    totalBeneficiaries: number;
    totalPaid: number;
    totalUnpaid: number;
  } = { totalBeneficiaries: 0, totalPaid: 0, totalUnpaid: 0 };

  constructor(public lookupService: LookupService) {}


  ngOnInit(): void {
  }

  private async createPdf(): Promise<any> {
    if (
      !this.reportReconciledSummaryResultCount ||
      this.reportReconciledSummaryResultCount.length === 0
    ) {
      console.error('No data available to generate PDF.');
      return null;
    }

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('landscape');

    // Add title
    doc.setFontSize(18);
    doc.text('Reconciled Details Result Report', 14, 20);

    // Add summary totals
    doc.setFontSize(10);
    const summaryText = `Total Beneficiaries: ${
      this.reportReconciledSummaryTotals.totalPaid +
      this.reportReconciledSummaryTotals.totalUnpaid
    } | Total Paid: ${
      this.reportReconciledSummaryTotals.totalPaid
    } | Total Unpaid: ${this.reportReconciledSummaryTotals.totalUnpaid}`;
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

    const data = this.reportReconciledSummaryResultCount.map(
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

    return doc;
  }

  async exportPdf() {
    const doc = await this.createPdf();
    if (doc) {
      doc.save('ReconciliationDetailReport.pdf');
    }
  }

  async previewPdf() {
    const doc = await this.createPdf();
    if (doc) {
      const string = doc.output('datauristring');
      const embed = "<embed width='100%' height='100%' src='" + string + "'/>";
      const x = window.open();
      if (x) {
        x.document.open();
        x.document.write(embed);
        x.document.close();
      }
    }
  }

  async exportExcel() {
     if (!this.reportReconciledSummaryResultCount || this.reportReconciledSummaryResultCount.length === 0) {
      console.error('No data available to export.');
      return;
    }

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(this.reportReconciledSummaryResultCount);

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
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reconciliation Detail Report');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ReconciliationDetailReport.xlsx');
  }
}
