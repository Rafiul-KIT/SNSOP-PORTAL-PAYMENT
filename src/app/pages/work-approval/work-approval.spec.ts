import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkApproval } from './work-approval';

describe('WorkApproval', () => {
  let component: WorkApproval;
  let fixture: ComponentFixture<WorkApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
