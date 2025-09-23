export const environment = {
  production: false,
  env: 'local',
  domain: 'localhost', // or 'snsopmis.local' if you use hosts file trick
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/', // your Spring Boot backend in dev
  portals: {
    master: 'https://localhost:4010',
    beneficiary: 'https://localhost:4020',
    payment: 'https://localhost:4030',
    grm: 'https://localhost:4040',
    report: 'https://localhost:4050',
  },
};