export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  authApi: 'https://devgwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: '/trial/master',
    masterSettings: '/trial/master/#/user-management/users',
    surveyCTO: '/trial/master/#/cto-dashboard',
    beneficiary: '/trial/beneficiary',
      mNe: '/trial/master/#/monitoring-evaluation/beneficiary-enrolment-summary',
    payment: '/trial/payment',
    grm: '/trial/grm',
    report: '/trial/master/#/home/metabase',
    economicOpportunities: '/trial/master/#/economic-opportunities/dashboard',
    underConstruction: '/trial/master/#/under-construction',
    dms: '/trial/dms/'
  },
  cookie_name:'mis_ta'
};
