const { test, expect } = require('@jest/globals');
const appHandler = require('../applications');

//const res = await appListHandler.getApplications();

//console.log(res);

// id: 747084
// profile: 79888
// guid: 2d87a2fc-e8b2-492c-aacb-f49ecda8b3ef
test('The call to get applications return more than 25 apps', async () => {
    // expect.assertions(1);
    // const appRes =  await appHandler.getApplications();
    // console.log(appRes);
    // expect(appRes).toBeDefined();
    //expect(appRes._embedded).toBeDefined();
    //console.log(appRes._embedded.applications[0]);
});

// test('The call to get a single application', async () => {
//     expect.assertions(1);
//     const appRes =  await appHandler.getApplicationByLegacyId(747084);
//     expect(appRes._embedded).toBeDefined();
//     console.log(appRes._embedded.applications[0]);
// });

module.exports = {
    setupFiles: ["../../../test/jestSetupEnv"]
}
