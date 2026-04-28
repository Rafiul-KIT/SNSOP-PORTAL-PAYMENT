export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  domain: 'https://newmis.southsudansafetynet.info',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  authApi: 'https://devgwapp.southsudansafetynet.info/mis_auth/',
  portals: {
    master: 'https://newmis.southsudansafetynet.info/trial/master',
    masterSettings: 'https://newmis.southsudansafetynet.info/trial/master/#/user-management/users',
    surveyCTO: 'https://newmis.southsudansafetynet.info/trial/master/#/cto-dashboard',
    beneficiary: 'https://newmis.southsudansafetynet.info/trial/beneficiary',
      mNe: 'https://newmis.southsudansafetynet.info/trial/master/#/monitoring-evaluation/beneficiary-enrolment-summary',
    payment: 'https://newmis.southsudansafetynet.info/trial/payment',
    grm: 'https://newmis.southsudansafetynet.info/trial/grm',
    report: 'https://newmis.southsudansafetynet.info/trial/report',
    economicOpportunities: 'https://newmis.southsudansafetynet.info/trial/master/#/economic-opportunities/dashboard',
  },
  cookie_name:'mis_ta'
};
