import { Component, Input, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { LookupService } from '../../../services/lookup.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  boma: string;
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
export class ReportReconciliationSummaryCount implements OnInit {
  @Input() reportReconciliationSummaryCount: ReportData[] = [];

  constructor(public lookupService: LookupService) {}

  ngOnInit(): void {}

  private createPdf(): jsPDF | null {
    if (
      !this.reportReconciliationSummaryCount ||
      this.reportReconciliationSummaryCount.length === 0
    ) {
      console.error('No data available to generate PDF.');
      return null;
    }
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape mode, mm units, A4 size

    // Title
    doc.setFontSize(16);
    doc.text('Reconciliation Summary Report', 14, 10);

    // Define headers
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

    const data = this.reportReconciliationSummaryCount.map(
      (row: ReportData, index: number) => [
        index + 1,
        this.lookupService.getBomaNameById(row.boma),
        row.totalDISPaid + row.totalDISUnpaid, // DIS Approved
        row.totalLIPWPaid + row.totalLIPWUnpaid, // LIPW Approved
        row.totalDISPaid,
        row.totalDISUnpaid,
        row.totalLIPWPaid,
        row.totalLIPWUnpaid,
        row.totalDISPaid + row.totalLIPWPaid,
        row.totalDISUnpaid + row.totalLIPWUnpaid,
      ]
    );

    // Add table to PDF
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 140, 0] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    return doc;
  }

  exportPdf() {
    const doc = this.createPdf();
    if (doc) {
      doc.save('Reconciliation_Summary.pdf');
    }
  }

  previewPdf() {
    const doc = this.createPdf();
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
}
