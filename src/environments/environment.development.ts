export const environment = {
  production: false,
  env: 'local',
  useHash: false,
  domain: 'localhost', // or 'snsopmis.local' if you use hosts file trick
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/', // your Spring Boot backend in dev
  portals: {
    master: 'https://localhost:4010',
    masterSettings: 'https://localhost:4010/#/home/portals',
    beneficiary: 'https://localhost:4020',
    payment: 'https://localhost:4030',
    grm: 'https://localhost:4040',
    report: 'https://localhost:4050',
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
