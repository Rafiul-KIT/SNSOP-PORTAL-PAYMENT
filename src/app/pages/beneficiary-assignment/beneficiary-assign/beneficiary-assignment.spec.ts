import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BeneficiaryAssignment } from './beneficiary-assignment';
import { ApiService } from '../../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BeneficiaryAssignment', () => {
  let component: BeneficiaryAssignment;
  let fixture: ComponentFixture<BeneficiaryAssignment>;
  let apiService: jasmine.SpyObj<ApiService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockSubproject: any = {
    id: 1,
    workCode: 'WC001',
    projectName: 'Test Project',
    stateName: 'Test State',
    countyName: 'Test County',
    payamName: 'Test Payam',
    bomaName: 'Test Boma',
    stateId: 1,
    countyId: 1,
    status: 'Active',
    screeningStatus: 'Completed',
  };

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['POST', 'GET']);
    // Mock the axiosInstance property which is used for form submission
    apiServiceSpy.axiosInstance = jasmine.createSpyObj('axiosInstance', [
      'post',
      'patch',
    ]);

    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [
        BeneficiaryAssignment,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiaryAssignment);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;

    // Mock the API calls that happen on initialization
    apiService.POST.and.returnValue(
      Promise.resolve({
        data: { code: 200, content: [mockSubproject], totalElements: 1 },
      })
    );
    apiService.GET.and.returnValue(
      Promise.resolve({
        data: { code: 200, content: [], totalElements: 0 },
      })
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize breadcrumb, form, and load data on init', fakeAsync(() => {
    spyOn(component, 'loadProjectData').and.callThrough();
    spyOn(component, 'loadCanBeAssignedBeneficiaries').and.callThrough();

    component.ngOnInit();
    tick(); // Wait for async operations in ngOnInit

    expect(component.breadcrumbItems.length).toBe(1);
    expect(component.projectForm).toBeDefined();
    expect(component.loadProjectData).toHaveBeenCalledWith('1');
    expect(
      component.loadCanBeAssignedBeneficiaries
    ).toHaveBeenCalledWith(0, 10);
  }));

  it('should load project data successfully', fakeAsync(() => {
    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toEqual(mockSubproject);
    expect(component.statusMsg).toBe('Loaded project successfully.');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));

  it('should handle no project data found', fakeAsync(() => {
    apiService.POST.and.returnValue(
      Promise.resolve({ data: { code: 200, content: [], totalElements: 0 } })
    );

    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toBeNull();
    expect(component.statusMsg).toBe('No data found.');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));

  it('should handle API error when loading project data', fakeAsync(() => {
    const error = { response: { data: { message: 'Server error' } } };
    apiService.POST.and.returnValue(Promise.reject(error));

    component.loadProjectData('1');
    tick();

    expect(component.projectInfo).toBeNull();
    expect(component.statusMsg).toBe('Error loading project data.');
    expect(cdr.detectChanges).toHaveBeenCalled();
  }));

  it('should get selected beneficiary IDs', () => {
    component.canBeAssignedBeneficiaries = [
      { id: 101, isSelected: true, beneficiaryName: 'A', gender: 'MALE', age: 30, householdMonthlyAvgIncome: 100, householdNumber: 'HH1', phoneNo: '111' },
      { id: 102, isSelected: false, beneficiaryName: 'B', gender: 'FEMALE', age: 40, householdMonthlyAvgIncome: 200, householdNumber: 'HH2', phoneNo: '222' },
      { id: 103, isSelected: true, beneficiaryName: 'C', gender: 'MALE', age: 50, householdMonthlyAvgIncome: 300, householdNumber: 'HH3', phoneNo: '333' },
    ];
    const selectedIds = component.getSelectedCanBeAssignedIds();
    expect(selectedIds).toEqual([101, 103]);
  });
});
