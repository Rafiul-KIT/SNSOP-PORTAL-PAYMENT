import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WageRequestDraftsApproval } from './wage-request-drafts-approval';

describe('WageRequestDraftsApproval', () => {
  let component: WageRequestDraftsApproval;
  let fixture: ComponentFixture<WageRequestDraftsApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WageRequestDraftsApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WageRequestDraftsApproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
