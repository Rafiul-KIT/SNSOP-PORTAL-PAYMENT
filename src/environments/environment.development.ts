export const environment = {
  production: false,
  domain: 'localhost', // or 'snsopmis.local' if you use hosts file trick
  globalApi: 'http://devteam.karoothitbd.com:8088/mis_server', // your Spring Boot backend in dev
  portals: {
    master: 'http://localhost:4010',
    beneficiary: 'http://localhost:4020',
    payment: 'http://localhost:4030',
    grm: 'http://localhost:4040',
    report: 'http://localhost:4050',
  },
};
