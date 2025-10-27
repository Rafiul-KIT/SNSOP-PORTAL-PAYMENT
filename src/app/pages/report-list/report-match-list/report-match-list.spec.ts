import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportMatchList } from './report-match-list';

describe('ReportMatchList', () => {
  let component: ReportMatchList;
  let fixture: ComponentFixture<ReportMatchList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportMatchList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportMatchList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
