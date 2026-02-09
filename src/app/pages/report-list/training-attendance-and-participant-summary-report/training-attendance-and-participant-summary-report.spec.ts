import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingAttendanceAndParticipantSummaryReport } from './training-attendance-and-participant-summary-report';

describe('TrainingAttendanceAndParticipantSummaryReport', () => {
  let component: TrainingAttendanceAndParticipantSummaryReport;
  let fixture: ComponentFixture<TrainingAttendanceAndParticipantSummaryReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingAttendanceAndParticipantSummaryReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingAttendanceAndParticipantSummaryReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
