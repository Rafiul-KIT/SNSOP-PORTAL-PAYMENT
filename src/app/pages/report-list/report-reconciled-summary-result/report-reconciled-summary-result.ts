import { Component, inject, input } from '@angular/core';

import { saveAs } from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { CurrencyPipe } from '@angular/common';
import { LookupService } from '../../../services/lookup.service';

interface ReconciledSummaryRow {
  householdNumber: string;
  name: string;
  enrolmentNumber: string;
  wage: number;
  supportType: string;
  reqNo: string;
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
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule, CurrencyPipe], // Import PrimeNG modules and CurrencyPipe
  templateUrl: './report-reconciled-summary-result.html',
  styleUrls: ['./report-reconciled-summary-result.scss'],
})
export class ReportReconciledSummaryResult {
  
  reportReconciledSummaryResult = input<ReconciledSummaryRow[]>([]);
  reportReconciledSummaryTotals = input<SummaryTotals>({
    totalBeneficiaries: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  });

 
  private lookupService = inject(LookupService);

  async exportPdf() {
    if (!this.reportReconciledSummaryResult()?.length) {
      console.error('No data available to export.');
      return;
    }

    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('landscape');
    const startX = 10;
    let startY = 20;
    const lineHeight = 8;
    const padding = 5;
    const headerFontSize = 10;
    const bodyFontSize = 8;

    const headers = [
      'Household Number',
      'Name',
      'Enrolment No',
      'Wage',
      'Support Type',
      'Request No',
      'Payment Cycle',
      'Payment Center',
      'Status',
    ];

    const columnWidths = [60, 25, 20, 15, 15, 30, 25, 25, 15];

   
    doc.setFontSize(headerFontSize);
    headers.forEach((header, i) => {
      const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + padding * i;
      doc.text(header, xPosition, startY);
    });
    startY += lineHeight;

  
    doc.setFontSize(bodyFontSize);
    this.reportReconciledSummaryResult().forEach((row) => {
      const rowData = [
        row.householdNumber || '',
        row.name || '',
        row.enrolmentNumber || '',
        row.wage.toString() || '',
        row.supportType || '',
        row.reqNo || '',
        row.paymentCycle || '',
        row.paymentCenter || '',
        row.status || '',
      ];

      rowData.forEach((data, i) => {
        const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + padding * i;
        doc.text(data.toString(), xPosition, startY);
      });

      startY += lineHeight;

     
      if (startY > 190) {
        doc.addPage('landscape');
        startY = 20;
        doc.setFontSize(headerFontSize);
        headers.forEach((header, i) => {
          const xPosition = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + padding * i;
          doc.text(header, xPosition, startY);
        });
        startY += lineHeight;
        doc.setFontSize(bodyFontSize);
      }
    });

    doc.save('ReconciliationDetailReport.pdf');
  }

  async exportExcel() {
    if (!this.reportReconciledSummaryResult()?.length) {
      console.error('No data available to export.');
      return;
    }

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(this.reportReconciledSummaryResult());

    // Adjust column widths
    const columnWidths = [
      { wch: 45 }, // Household Number
      { wch: 25 }, // Name
      { wch: 15 }, // Enrolment Number
      { wch: 10 }, // Wage
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
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reconciliation Summary');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'ReconciliationDetailReport.xlsx');
  }
}