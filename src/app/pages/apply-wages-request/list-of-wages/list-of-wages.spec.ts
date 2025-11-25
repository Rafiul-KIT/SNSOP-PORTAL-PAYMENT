import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfWages } from './list-of-wages';

describe('ListOfWages', () => {
  let component: ListOfWages;
  let fixture: ComponentFixture<ListOfWages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfWages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListOfWages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
