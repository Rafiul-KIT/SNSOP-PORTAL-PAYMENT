import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportCompleteHouseholdSurvey } from './report-complete-household-survey';

describe('ReportCompleteHouseholdSurvey', () => {
  let component: ReportCompleteHouseholdSurvey;
  let fixture: ComponentFixture<ReportCompleteHouseholdSurvey>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportCompleteHouseholdSurvey]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportCompleteHouseholdSurvey);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
