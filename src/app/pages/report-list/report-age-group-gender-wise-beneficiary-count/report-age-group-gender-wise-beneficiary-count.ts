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
}

@Component({
  selector: 'app-report-age-group-gender-wise-beneficiary-count',
  standalone: true,
  imports: [TableModule, ButtonModule, TooltipModule], 
  templateUrl: './report-age-group-gender-wise-beneficiary-count.html',
  styleUrls: ['./report-age-group-gender-wise-beneficiary-count.scss'],
})
export class ReportAgeGroupGenderWiseBeneficiaryCount {
 
  reportResult = input<any>(null);

 
  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  beneficiaryList = signal<any[]>([]);

  
  public lookupService = inject(LookupService);

  async exportPdf() {
    const filteredListForPDF: any[] = this.beneficiaryList().map((element: any) => ({
      State: element.stateId > 0 ? this.lookupService.getStateNameById(element.stateId) : '-',
      County: element.countyId > 0 ? this.lookupService.getCountyNameById(element.countyId) : '-',
      Payam: element.payamId > 0 ? this.lookupService.getPayamNameById(element.payamId) : '-',
      Boma: element.bomaId > 0 ? this.lookupService.getBomaNameById(element.bomaId) : '-',
      Between_0_to_2_Female: element.female?._0_to_2,
      Between_0_to_2_Male: element.male?._0_to_2,
      Between_3_to_5_Female: element.female?._3_to_5,
      Between_3_to_5_Male: element.male?._3_to_5,
      Between_6_to_17_Female: element.female?._6_to_17,
      Between_6_to_17_Male: element.male?._6_to_17,
      Between_18_to_35_Female: element.female?._18_to_35,
      Between_18_to_35_Male: element.male?._18_to_35,
      Between_36_to_64_Female: element.female?._36_to_64,
      Between_36_to_64_Male: element.male?._36_to_64,
      Above_64_Female: element.female?._64_and_above,
      Above_64_Male: element.male?._64_and_above,
    }));

    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('landscape', 'pt', 'a4');
    (doc as any).autoTable(this.exportColumns(), filteredListForPDF);
    doc.save(`age_group_gender_wise_beneficiary_count_${Date.now()}.pdf`);
  }

  async exportExcel() {
    const filteredListForXL: any[] = this.beneficiaryList().map((element: any) => ({
      State: element.stateId > 0 ? this.lookupService.getStateNameById(element.stateId) : '-',
      County: element.countyId > 0 ? this.lookupService.getCountyNameById(element.countyId) : '-',
      Payam: element.payamId > 0 ? this.lookupService.getPayamNameById(element.payamId) : '-',
      Boma: element.bomaId > 0 ? this.lookupService.getBomaNameById(element.bomaId) : '-',
      Between_0_to_2_Female: element.female?._0_to_2,
      Between_0_to_2_Male: element.male?._0_to_2,
      Between_3_to_5_Female: element.female?._3_to_5,
      Between_3_to_5_Male: element.male?._3_to_5,
      Between_6_to_17_Female: element.female?._6_to_17,
      Between_6_to_17_Male: element.male?._6_to_17,
      Between_18_to_35_Female: element.female?._18_to_35,
      Between_18_to_35_Male: element.male?._18_to_35,
      Between_36_to_64_Female: element.female?._36_to_64,
      Between_36_to_64_Male: element.male?._36_to_64,
      Above_64_Female: element.female?._64_and_above,
      Above_64_Male: element.male?._64_and_above,
    }));

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(filteredListForXL);
    const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'age_group_gender_wise_beneficiary_count_');
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
      { field: 'male._0_to_2', nestedField: '_0_to_2', header: '0 to 2' },
      { field: 'male._3_to_5', nestedField: '_3_to_5', header: '3 to 5' },
      { field: 'male._6_to_17', nestedField: '_6_to_17', header: '6 to 17' },
      { field: 'male._18_to_35', nestedField: '_18_to_35', header: '18 to 35' },
      { field: 'male._36_to_64', nestedField: '_36_to_64', header: '36 to 64' },
      { field: 'male._64_and_above', nestedField: '_64_and_above', header: '64+' },
      { field: 'female._0_to_2', nestedField: '_0_to_2', header: '0 to 2' },
      { field: 'female._3_to_5', nestedField: '_3_to_5', header: '3 to 5' },
      { field: 'female._6_to_17', nestedField: '_6_to_17', header: '6 to 17' },
      { field: 'female._18_to_35', nestedField: '_18_to_35', header: '18 to 35' },
      { field: 'female._36_to_64', nestedField: '_36_to_64', header: '36 to 64' },
      { field: 'female._64_and_above', nestedField: '_64_and_above', header: '64+' },
    ]);

    this.exportColumns.set([
      { dataKey: 'State', title: 'State' },
      { dataKey: 'County', title: 'County' },
      { dataKey: 'Payam', title: 'Payam' },
      { dataKey: 'Boma', title: 'Boma' },
      { dataKey: 'Between_0_to_2_Female', title: 'Between 0 to 2 (Female)' },
      { dataKey: 'Between_0_to_2_Male', title: 'Between 0 to 2 (Male)' },
      { dataKey: 'Between_3_to_5_Female', title: 'Between 3 to 5 (Female)' },
      { dataKey: 'Between_3_to_5_Male', title: 'Between 3 to 5 (Male)' },
      { dataKey: 'Between_6_to_17_Female', title: 'Between 6 to 17 (Female)' },
      { dataKey: 'Between_6_to_17_Male', title: 'Between 6 to 17 (Male)' },
      { dataKey: 'Between_18_to_35_Female', title: 'Between 18 to 35 (Female)' },
      { dataKey: 'Between_18_to_35_Male', title: 'Between 18 to 35 (Male)' },
      { dataKey: 'Between_36_to_64_Female', title: 'Between 36 to 64 (Female)' },
      { dataKey: 'Between_36_to_64_Male', title: 'Between 36 to 64 (Male)' },
      { dataKey: 'Above_64_Female', title: 'Above 64 (Female)' },
      { dataKey: 'Above_64_Male', title: 'Above 64 (Male)' },
    ]);

    this.beneficiaryList.set(this.reportResult()?.data ?? []);
  }
}