export const environment = {
  production: false,
  enableAuth: false,
  env: 'local',
  useHash: false,
  domain: 'localhost', // or 'snsopmis.local' if you use hosts file trick
  globalApi: 'http://localhost:8090/mis_server/', // your Spring Boot backend in dev
  authApi: 'http://localhost:8090/mis_auth/',
  portals: {
    master: 'http://localhost:4010',
    masterSettings: 'http://localhost:4010/#/user-management/users',
    surveyCTO: 'http://localhost:4010/#/survey-cto',
    beneficiary: 'http://localhost:4020',
    payment: 'http://localhost:4030',
    grm: 'http://localhost:4040',
    report: 'http://localhost:4050',
  },
  cookie_name:'mis_ta'
};
