import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingAttendance } from './training-attendance';

describe('TrainingAttendance', () => {
  let component: TrainingAttendance;
  let fixture: ComponentFixture<TrainingAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingAttendance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
