export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  authApi: 'https://qa-gwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: '/v2/',
    masterSettings: '/v2/#/user-management/users',
    surveyCTO: '/v2/#/cto-dashboard',
    beneficiary: '/v2/beneficiary/',
    mNe: '/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    payment: '/v2/payment',
    grm: '/v2/grm',
    report: '/v2/#/home/metabase',
    economicOpportunities: '/v2/#/economic-opportunities/dashboard',
    underConstruction: '/v2/#/under-construction',
    dms: '/v2/dms/'
  },
  cookie_name:'mis_ta'
};
