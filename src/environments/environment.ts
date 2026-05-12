export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://mis.southsudansafetynet.info',
  globalApi: 'https://gwapp.southsudansafetynet.info/mis_server/',
  authApi: 'https://gwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: 'https://mis.southsudansafetynet.info/v2/',
    masterSettings: 'https://mis.southsudansafetynet.info/v2/#/user-management/users',
    surveyCTO: 'https://mis.southsudansafetynet.info/v2/#/cto-dashboard',
    beneficiary: 'https://mis.southsudansafetynet.info/v2/beneficiary/',
    payment: 'https://mis.southsudansafetynet.info/v2/payment',
     mNe: 'https://mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    grm: 'https://mis.southsudansafetynet.info/v2/grm',
    report: 'https://mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard',
    // underConstruction: 'https://mis.southsudansafetynet.info/v2/#/under-construction'
  },
  cookie_name:'mis_ta'
};
