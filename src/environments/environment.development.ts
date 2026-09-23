export const environment = {
  production: false,
  env: 'local',
  useHash: false,
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/', // your Spring Boot backend in dev
  authApi: 'https://devgwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: 'https://localhost:4010',
    masterSettings: 'https://localhost:4010/#/user-management/users',
    surveyCTO: 'https://localhost:4010/#/cto-dashboard',
     mNe: 'https://localhost:4010/#/monitoring-evaluation/beneficiary-enrolment-summary',
    beneficiary: 'https://localhost:4020',
    payment: 'https://localhost:4030',
    grm: 'https://localhost:4040',
    report: 'https://localhost:4010/#/home/metabase',
    economicOpportunities: 'https://localhost:4010/#/economic-opportunities/dashboard',
    underConstruction: 'https://localhost:4010/#/under-construction',
    dms: 'https://localhost:8086'
  },
  cookie_name:'mis_ta'
};
