import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubProjectDetails } from './sub-project-details';

describe('SubProjectDetails', () => {
  let component: SubProjectDetails;
  let fixture: ComponentFixture<SubProjectDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubProjectDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubProjectDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
