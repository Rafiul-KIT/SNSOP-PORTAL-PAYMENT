import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportLocationWiseNomineeCount } from './report-location-wise-nominee-count';

describe('ReportLocationWiseNomineeCount', () => {
  let component: ReportLocationWiseNomineeCount;
  let fixture: ComponentFixture<ReportLocationWiseNomineeCount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportLocationWiseNomineeCount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportLocationWiseNomineeCount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
