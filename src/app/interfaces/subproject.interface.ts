export interface Subproject {
  id: number;
  workCode: string;
  projectName: string;
  stateName: string;
  countyName: string;
  stateId: number;
  countyId: number;
  status: string;
  screeningStatus: string;
  workName?: string;
}
