import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleAttendanceReport } from './multiple-attendance-report';

describe('MultipleAttendanceReport', () => {
  let component: MultipleAttendanceReport;
  let fixture: ComponentFixture<MultipleAttendanceReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleAttendanceReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleAttendanceReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
