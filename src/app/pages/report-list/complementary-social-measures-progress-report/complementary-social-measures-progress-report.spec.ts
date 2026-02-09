import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplementarySocialMeasuresProgressReport } from './complementary-social-measures-progress-report';

describe('ComplementarySocialMeasuresProgressReport', () => {
  let component: ComplementarySocialMeasuresProgressReport;
  let fixture: ComponentFixture<ComplementarySocialMeasuresProgressReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplementarySocialMeasuresProgressReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplementarySocialMeasuresProgressReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
