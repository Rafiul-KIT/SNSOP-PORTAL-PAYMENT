import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { saveAs } from 'file-saver';
import { LookupService } from '../../../services/lookup.service';

interface ReportData {
  boma: string ;
  totalDISApproved: number;
  totalLIPWApproved: number;
  totalDISPaid: number;
  totalDISUnpaid: number;
  totalLIPWPaid: number;
  totalLIPWUnpaid: number;
}

@Component({
  selector: 'app-report-reconciliation-summary-count',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule, PaginatorModule], 
  templateUrl: './report-reconciliation-summary-count.html',
  styleUrls: ['./report-reconciliation-summary-count.scss'],
})
export class ReportReconciliationSummaryCount {
 
  reportReconciliationSummaryCount = input<ReportData[]>([]);


  public lookupService = inject(LookupService);

  async exportPdf() {
    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('l', 'mm', 'a4');

 
    doc.setFontSize(16);
    doc.text('Reconciliation Summary Report', 14, 10);

    const headers = [
      [
        'Serial No',
        'Name of Boma',
        'DIS Approved',
        'LIPW Approved',
        'DIS Paid',
        'DIS Unpaid',
        'LIPW Paid',
        'LIPW Unpaid',
        'Total Paid (DIS + LIPW)',
        'Total Unpaid (DIS + LIPW)',
      ],
    ];

 
    const data = this.reportReconciliationSummaryCount().map((row, index) => [
      index + 1,
      this.lookupService.getBomaNameById(row.boma),
      row.totalDISApproved,
      row.totalLIPWApproved,
      row.totalDISPaid,
      row.totalDISUnpaid,
      row.totalLIPWPaid,
      row.totalLIPWUnpaid,
      row.totalDISPaid + row.totalLIPWPaid,
      row.totalDISUnpaid + row.totalLIPWUnpaid,
    ]);

   
    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 140, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save('Reconciliation_Summary.pdf');
  }

  async exportExcel() {
    if (!this.reportReconciliationSummaryCount()?.length) {
      console.error('No data available to export.');
      return;
    }

    const data = this.reportReconciliationSummaryCount().map((row, index) => ({
      'Serial No': index + 1,
      'Name of Boma': this.lookupService.getBomaNameById(row.boma),
      'DIS Approved': row.totalDISApproved,
      'LIPW Approved': row.totalLIPWApproved,
      'DIS Paid': row.totalDISPaid,
      'DIS Unpaid': row.totalDISUnpaid,
      'LIPW Paid': row.totalLIPWPaid,
      'LIPW Unpaid': row.totalLIPWUnpaid,
      'Total Paid (DIS + LIPW)': row.totalDISPaid + row.totalLIPWPaid,
      'Total Unpaid (DIS + LIPW)': row.totalDISUnpaid + row.totalLIPWUnpaid,
    }));

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(data);
    const columnWidths = [
      { wch: 10 }, // Serial No
      { wch: 30 }, // Name of Boma
      { wch: 15 }, // DIS Approved
      { wch: 15 }, // LIPW Approved
      { wch: 15 }, // DIS Paid
      { wch: 15 }, // DIS Unpaid
      { wch: 15 }, // LIPW Paid
      { wch: 15 }, // LIPW Unpaid
      { wch: 20 }, // Total Paid
      { wch: 20 }, // Total Unpaid
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reconciliation Summary');
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Reconciliation_Summary.xlsx');
  }
}