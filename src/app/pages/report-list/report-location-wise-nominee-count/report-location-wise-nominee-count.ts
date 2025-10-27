import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';
import FileSaver from 'file-saver';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LookupService } from '../../../services/lookup.service';

interface Column {
  field: string;
  nestedField?: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
  displayProperty?: string; 
}

@Component({
  selector: 'app-report-location-wise-nominee-count',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule], // Import PrimeNG modules
  templateUrl: './report-location-wise-nominee-count.html',
  styleUrls: ['./report-location-wise-nominee-count.scss'],
})
export class ReportLocationWiseNomineeCount {

  reportResult = input<any>(null);

 
  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  nomineeCountList = signal<any[]>([]);


  public lookupService = inject(LookupService);

  async exportPdf() {
    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('l', 'px', 'a4');
    (doc as any).autoTable({
      body: this.nomineeCountList(),
      columns: this.exportColumns(),
      didParseCell: (data: any) => {
        if (data.column.raw.displayProperty) {
          const prop = data.column.raw.displayProperty;
          const text = data.cell.raw[prop];
          const tType = data.cell.section;
          if (text) {
            data.cell.text = text.toString();
          } else {
            data.cell.text = tType === 'head' ? data.cell.raw : '0';
          }
        }
      },
    });
    doc.save(`location_wise_nominee_count_${Date.now()}.pdf`);
  }

  async exportExcel() {
    const filteredListForXL: any[] = this.nomineeCountList().map((element: any) => ({
      State: element.stateId > 0 ? this.lookupService.getStateNameById(element.stateId) : '-',
      County: element.countyId > 0 ? this.lookupService.getCountyNameById(element.countyId) : '-',
      Payam: element.payamId > 0 ? this.lookupService.getPayamNameById(element.payamId) : '-',
      Boma: element.bomaId > 0 ? this.lookupService.getBomaNameById(element.bomaId) : '-',
      Count: element.householdCount,
    }));

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(filteredListForXL);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'location_wise_nominee_count_');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, `${fileName}${Date.now()}${EXCEL_EXTENSION}`);
  }

  ngOnInit() {
    this.cols.set([
      { field: 'stateId', header: 'STATE' },
      { field: 'countyId', header: 'COUNTY' },
      { field: 'payamId', header: 'PAYAM' },
      { field: 'bomaId', header: 'BOMA' },
      { field: 'householdCount', header: 'NOMINEE COUNT' },
    ]);

    this.exportColumns.set([
      { dataKey: 'State', title: 'State', displayProperty: 'stateId' },
      { dataKey: 'County', title: 'County', displayProperty: 'countyId' },
      { dataKey: 'Payam', title: 'Payam', displayProperty: 'payamId' },
      { dataKey: 'Boma', title: 'Boma', displayProperty: 'bomaId' },
      { dataKey: 'Count', title: 'Nominee Count', displayProperty: 'householdCount' },
    ]);

    this.nomineeCountList.set(this.reportResult()?.dataList ?? []);
  }
}