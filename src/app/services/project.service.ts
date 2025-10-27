import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor() { }

  getProjectInfo(): Observable<any> {
    const projectInfo = {
      projectName: 'SNSOP 2023',
      workCode: '2024-SNSOP-SNSOP 2023-3262',
      approvedDate: '13-10-2023',
      state: 'CENTRAL EQUATORIA',
      county: 'JUBA',
      payam: 'KATOR',
      bomaName: 'MIJIKI'
    };
    return of(projectInfo).pipe(delay(1000));
  }
}
