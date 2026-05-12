export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  domain: 'https://qa-mis.southsudansafetynet.info',
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  authApi: 'https://qa-gwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: 'https://qa-mis.southsudansafetynet.info/v2/',
    masterSettings: 'https://qa-mis.southsudansafetynet.info/v2/#/user-management/users',
    surveyCTO: 'https://qa-mis.southsudansafetynet.info/v2/#/cto-dashboard',
    beneficiary: 'https://qa-mis.southsudansafetynet.info/v2/beneficiary/',
    mNe: 'https://qa-mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    payment: 'https://qa-mis.southsudansafetynet.info/v2/payment',
    grm: 'https://qa-mis.southsudansafetynet.info/v2/grm',
    report: 'https://qa-mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://qa-mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard',
    // underConstruction: 'https://qa-mis.southsudansafetynet.info/v2/#/under-construction'
  },
  cookie_name:'mis_ta'
};
