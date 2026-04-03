import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubprojectViewDetails } from './subproject-view-details';

describe('SubprojectViewDetails', () => {
  let component: SubprojectViewDetails;
  let fixture: ComponentFixture<SubprojectViewDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubprojectViewDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubprojectViewDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
