import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';
import FileSaver from 'file-saver';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LookupService } from '../../../services/lookup.service';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-report-staff-wise-beneficiary-count',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule],
  templateUrl: './report-staff-wise-beneficiary-count.html',
  styleUrls: ['./report-staff-wise-beneficiary-count.scss'],
})
export class ReportStaffWiseBeneficiaryCount {

  reportResult = input<any>(null);

 
  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  beneficiaryList = signal<any[]>([]);

  private lookupService = inject(LookupService);

  async exportPdf() {
    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('l', 'px', 'a4');
    (doc as any).autoTable(this.exportColumns(), this.beneficiaryList());
    doc.save(`staff_wise_beneficiary_count_${Date.now()}.pdf`);
  }

 
  async exportExcel() {
    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(this.beneficiaryList());
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'staff_wise_beneficiary_count_');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, `${fileName}${Date.now()}${EXCEL_EXTENSION}`);
  }

  ngOnInit() {
 
    this.cols.set([
      { field: 'staffId', header: 'Staff ID' },
      { field: 'staffName', header: 'Staff Name' },
      { field: 'registrationPhase', header: 'Registration Phase' },
      { field: 'count', header: 'Beneficiary Count' },
    ]);


    this.exportColumns.set(
      this.cols().map((col) => ({ title: col.header, dataKey: col.field }))
    );

    this.beneficiaryList.set(this.reportResult()?.data ?? []);
  }
}