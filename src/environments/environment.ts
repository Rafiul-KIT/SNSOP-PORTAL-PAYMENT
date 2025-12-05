export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://mis.southsudansafetynet.info',
  globalApi: 'https://gwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://mis.southsudansafetynet.info/v2/',
    masterSettings: 'https://mis.southsudansafetynet.info/v2/#/home/portals',
    beneficiary: 'https://mis.southsudansafetynet.info/v2/beneficiary/',
    payment: 'https://mis.southsudansafetynet.info/v2/payment',
    grm: 'https://mis.southsudansafetynet.info/v2/grm',
    report: 'https://mis.southsudansafetynet.info/v2/report',
  },
  authBackend: 'https://gwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
