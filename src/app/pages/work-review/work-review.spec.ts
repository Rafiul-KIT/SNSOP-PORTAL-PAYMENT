import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkReview } from './work-review';

describe('WorkReview', () => {
  let component: WorkReview;
  let fixture: ComponentFixture<WorkReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
