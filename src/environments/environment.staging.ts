export const environment = {
  production: false,
  enableAuth: true,
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
    payment: 'https://newmis.southsudansafetynet.info/trial/payment',
    grm: 'https://newmis.southsudansafetynet.info/trial/grm',
    report: 'https://newmis.southsudansafetynet.info/trial/report',
  },
  cookie_name:'mis_ta'
};
