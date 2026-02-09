import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingAttendancePerform } from './training-attendance-perform';

describe('TrainingAttendancePerform', () => {
  let component: TrainingAttendancePerform;
  let fixture: ComponentFixture<TrainingAttendancePerform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingAttendancePerform]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingAttendancePerform);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
