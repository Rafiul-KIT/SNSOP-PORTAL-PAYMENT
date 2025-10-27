import { Component, inject, input } from '@angular/core';
import { signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { LookupService } from '../../../services/lookup.service';

interface HouseholdSurveyData {
  date: string;
  af_file?: string;
  parent_file?: string;
  all_file?: string;
}

@Component({
  selector: 'app-report-complete-household-survey',
  standalone: true,
  imports: [TableModule], 
  templateUrl: './report-complete-household-survey.html',
  styleUrls: ['./report-complete-household-survey.scss'],
})
export class ReportCompleteHouseholdSurvey {

  reportResult = input<any>(null);

  householdSurveyData = signal<HouseholdSurveyData[]>([]);

  downloadLocation = 'https://snsopapk.southsudansafetynet.info/download/reports/';

  private lookupService = inject(LookupService);

  extractDateFromFileName(fileName: string): string {
    const datePattern = /\d{2}-\d{2}-\d{4}/;
    const match = fileName.match(datePattern);

    if (!match) {
      return 'N/A';
    }

    const [day, month, year] = match[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formattedDate.replace(/^(\d+)\s/, '$1th ');
  }

  ngOnInit() {
    const files = this.reportResult()?.files ?? [];
    const groupedByDate: { [key: string]: { af_file?: string; parent_file?: string; all_file?: string } } = {};

    for (const file of files) {
      const dateStr = this.extractDateFromFileName(file.fileName);
      if (dateStr === 'N/A') continue;

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {};
      }
      if (file.registrationPhase === 'AF') {
        groupedByDate[dateStr].af_file = file.fileName;
      } else if (file.registrationPhase === 'PARENT') {
        groupedByDate[dateStr].parent_file = file.fileName;
      } else if (file.registrationPhase === 'ALL') {
        groupedByDate[dateStr].all_file = file.fileName;
      }
    }

    this.householdSurveyData.set(
      Object.keys(groupedByDate).map((date) => ({
        date,
        af_file: groupedByDate[date].af_file,
        parent_file: groupedByDate[date].parent_file,
        all_file: groupedByDate[date].all_file,
      }))
    );
  }
}