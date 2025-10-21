import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubProjectList } from './sub-project-list';

describe('SubProjectList', () => {
  let component: SubProjectList;
  let fixture: ComponentFixture<SubProjectList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubProjectList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubProjectList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
