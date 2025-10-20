import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubProject } from './sub-project';

describe('SubProject', () => {
  let component: SubProject;
  let fixture: ComponentFixture<SubProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubProject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubProject);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
