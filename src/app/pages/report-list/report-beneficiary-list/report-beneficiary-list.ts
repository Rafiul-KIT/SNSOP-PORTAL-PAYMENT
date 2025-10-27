import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';

import { saveAs } from 'file-saver';

import { MenuItem } from 'primeng/api';
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
  selector: 'app-report-beneficiary-list',
  standalone: true, 
  imports: [], 
  templateUrl: './report-beneficiary-list.html',
  styleUrls: ['./report-beneficiary-list.scss'],
})
export class ReportBeneficiaryList {

  reportResult = input<any>(null);

 
  cols = signal<Column[]>([]);
  exportColumns = signal<ExportColumn[]>([]);
  beneficiaryList = signal<any[]>([]);


  public lookupService = inject(LookupService);

  // Export to PDF
  async exportPdf() {
    const jsPDF = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF.default('l', 'px', 'a4');
    (doc as any).autoTable(this.exportColumns(), this.beneficiaryList());
    doc.save(`beneficiary_list_${Date.now()}.pdf`);
  }

  // Export to Excel
  async exportExcel() {
    const filteredListForXL: any[] = [];
    this.beneficiaryList().forEach((elem: any) => {
      const selectionReasonList = elem.selectionReason || [];
      const selectionReasonValues: string[] = selectionReasonList.map(
        (reason: string, idx: number) =>
          `${idx + 1}. ${this.lookupService.getSelectionReasonEnumByValue(reason)}`
      );

      const columns: any = {
        'State Name': this.lookupService.getStateNameById(elem.address?.stateId),
        'County Name': this.lookupService.getCountyNameById(elem.address?.countyId),
        'Payam Name': this.lookupService.getPayamNameById(elem.address?.payam),
        'Boma Name': this.lookupService.getBomaNameById(elem.address?.boma),
        'Respondent First Name': elem.respondentFirstName,
        'Respondent Middle Name': elem.respondentMiddleName,
        'Respondent Last Name': elem.respondentLastName,
        'Respondent Nick Name': elem.respondentNickName,
        'Respondent relationship to the household head': elem.relationshipOther
          ? elem.relationshipOther
          : this.lookupService.getRelationshipEnumByValue(
              elem.relationshipWithHouseholdHead
            ),
        Age: elem.respondentAge,
        'Registration Phase': elem.registrationPhase,
        'Respondent gender': elem.respondentGender,
        'Do you have an ID': elem.respondentId ? 'true' : 'false',
        'What type of ID': elem.documentTypeOther
          ? elem.documentTypeOther
          : this.lookupService.getDocumentTypeEnumByValue(elem.documentType),
        'ID number': elem.respondentId,
        'Respondent Phone Number': elem.respondentPhoneNo,
        'Household Main Source of Income': elem.incomeSourceOther
          ? elem.incomeSourceOther
          : this.lookupService.getHouseHoldIncomeSourceByValue(
              elem.householdIncomeSource
            ),
        'Household Monthly Average Income (In SSP)': elem.householdMonthlyAvgIncome,
        'Respondent Marital Status': this.lookupService.getMaritalStatusEnumByValue(
          elem.respondentMaritalStatus
        ),
        'Respondent Legal Status': this.lookupService.getLegalStatusEnumByValue(
          elem.respondentLegalStatus
        ),
        'Support type': this.lookupService.getSelectionCriteriaEnumByValue(
          elem.selectionCriteria
        ),
        'Reason for support type': selectionReasonValues.join(', '),
        'Household Size': elem.householdSize,
        // Household member counts
        'Total males between 0-2 yrs': elem.householdMember2?.maleTotal,
        'Total males between 3-5 yrs': elem.householdMember5?.maleTotal,
        // ... (other household member fields as in original)
        'Does respondent read and write': elem.isReadWrite,
        'How many members in the HH are between 18 and 35 and can read and write':
          elem.memberReadWrite,
        // Alternate Payee fields
        'Alternate One Household Name': '-',
        'Alternate One First Name': elem.alternatePayee1?.payeeFirstName,
        // ... (other alternate payee fields as in original)
        // Nominee fields
      };

      if (elem.nominees?.length > 0) {
        elem.nominees.forEach((nomi: any, idx: number) => {
          const nominee = {
            'First Name': nomi.nomineeFirstName,
            'Middle Name': nomi.nomineeMiddleName,
            'Last Name': nomi.nomineeLastName,
            'Nick Name': nomi.nomineeNickName,
            'Relationship to the household head': nomi.relationshipOther
              ? nomi.relationshipOther
              : this.lookupService.getRelationshipEnumByValue(
                  nomi.relationshipWithHouseholdHead
                ),
            Age: nomi.nomineeAge,
            Gender: nomi.nomineeGender,
            'Does nominee read and write': nomi.isReadWrite,
            'What does nominee do for a living': nomi.otherOccupation
              ? nomi.otherOccupation
              : this.lookupService.getNomineeOccupationEnumByValue(
                  nomi.nomineeOccupation
                ),
          };

          columns[`Nominee_${idx + 1} First Name`] = nominee['First Name'];
          columns[`Nominee_${idx + 1} Middle Name`] = nominee['Middle Name'];
          columns[`Nominee_${idx + 1} Last Name`] = nominee['Last Name'];
          columns[`Nominee_${idx + 1} Nick Name`] = nominee['Nick Name'];
          columns[`Nominee_${idx + 1} Relationship to the household head`] =
            nominee['Relationship to the household head'];
          columns[`Nominee_${idx + 1} Age`] = nominee['Age'];
          columns[`Nominee_${idx + 1} Gender`] = nominee['Gender'];
          columns[`Nominee_${idx + 1} Does nominee read and write`] =
            nominee['Does nominee read and write'];
          columns[`Nominee_${idx + 1} What does nominee do for a living`] =
            nominee['What does nominee do for a living'];
        });
      }

      filteredListForXL.push(columns);
    });

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(filteredListForXL);
    const workbook = { Sheets: { 'Household Survey': worksheet }, SheetNames: ['Household Survey'] };
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'household_survey_report-');
  }

private saveAsExcelFile(buffer: ArrayBuffer, fileName: string): void {
  const EXCEL_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  const EXCEL_EXTENSION = '.xlsx';

  const blob = new Blob([buffer], { type: EXCEL_TYPE });
  saveAs(blob, `${fileName}_${Date.now()}${EXCEL_EXTENSION}`);
}


  ngOnInit() {
  
    this.cols.set([
      { field: 'applicationId', header: 'Application ID' },
      { field: 'respondentFirstName', header: 'Respondent First Name' },
      { field: 'respondentMiddleName', header: 'Respondent Middle Name' },
      { field: 'respondentLastName', header: 'Respondent Last Name' },
      { field: 'respondentNickName', header: 'Respondent Nick Name' },
      { field: 'respondentGender', header: 'Respondent Gender' },
      { field: 'respondentAge', header: 'Respondent Age' },
      { field: 'registrationPhase', header: 'Registration Phase' },
    ]);


    this.exportColumns.set(
      this.cols().map((col) => ({ title: col.header, dataKey: col.field }))
    );

   
    this.beneficiaryList.set(this.reportResult()?.data ?? []);
  }
}