import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BeneficiaryAssignment } from './beneficiary-assignment';
import { ApiService } from '../../../services/api.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Helper to create a valid mock AxiosResponse
const createMockAxiosResponse = (data: any): any => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

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
    apiServiceSpy.axiosInstance = jasmine.createSpyObj('axiosInstance', [
      'post',
      'patch',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
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
        { provide: Router, useValue: routerSpy },
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
      Promise.resolve(createMockAxiosResponse({ code: 200, content: [mockSubproject], totalElements: 1 }))
    );
    apiService.GET.and.returnValue(
      Promise.resolve(createMockAxiosResponse({ code: 200, content: [], totalElements: 0 }))
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
      Promise.resolve(createMockAxiosResponse({ code: 200, content: [], totalElements: 0 }))
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
    component.selectedBeneficiaryIds = new Set([101, 103]);
    const selectedIds = component.getSelectedCanBeAssignedIds();
    expect(selectedIds).toEqual([101, 103]);
  });
});
