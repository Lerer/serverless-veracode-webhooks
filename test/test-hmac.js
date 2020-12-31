const buildInfoHandler = require('../util/apis/buildInfo');
const appHandler = require('../util/apis/applications');
const sandboxHandler = require('../util/apis/sandboxes');

//const res = await appListHandler.getApplications();

//console.log(res);

// id: 747084
// profile: 79888
// guid: 2d87a2fc-e8b2-492c-aacb-f49ecda8b3ef
const testGetAppByID = async () => {
    const appRes =  await appHandler.getApplicationByLegacyId(747084);
    console.log(appRes._embedded.applications[0]);
}

const testSandboxesList = async () => {
    const sandboxes = await sandboxHandler.getSandboxesByAppGUID('2d87a2fc-e8b2-492c-aacb-f49ecda8b3ef');
    console.log(sandboxes._embedded.sandboxes);
}

const testSandboxLastScanStatus = async () => {
    const sandbox = await sandboxHandler.getSandboxByGUID('2d87a2fc-e8b2-492c-aacb-f49ecda8b3ef','e5dfb260-beea-4ce1-a4d9-490691e2f5f2');
    console.log(sandbox);
}

const testAppBuildInfo = async () => {
  const buildInfo = await buildInfoHandler.getAppbuildInfo(747084,null);
  console.log(buildInfo);
}

const testSandboxBuildInfo = async () => {
  const buildInfo = await buildInfoHandler.getAppbuildInfo(747084,2656195);
  console.log(buildInfo);
}

/*
scans: [
    {
      scan_type: 'STATIC',
      status: 'INCOMPLETE',
      modified_date: null,
      scan_url: 'StaticOverview:74838:747084:10187958:10162699:10178362',
      internal_status: 'incomplete'
    }
  ],

scans: [
    {
      scan_type: 'STATIC',
      status: 'STATIC_VALIDATING_UPLOAD',
      modified_date: null,
      scan_url: 'StaticOverview:74838:747084:10187958:10162699:10178362',
      internal_status: 'preflightsubmitted'
    }
  ],
scans: [
  {
    scan_type: 'STATIC',
    status: 'SCAN_IN_PROGRESS',
    modified_date: null,
    scan_url: 'StaticOverview:74838:747084:10187958:10162699:10178362',
    internal_status: 'submitted'
  }
]

scans: [
  {
    scan_type: 'STATIC',
    status: 'SCAN_IN_PROGRESS_PARTIAL_RESULTS_READY',
    modified_date: null,
    scan_url: 'StaticOverview:74838:747084:10187958:10162699:10178362',
    internal_status: 'scaninprocess'
  }
]

scans: [
  {
    scan_type: 'STATIC',
    status: 'PUBLISHED',
    modified_date: '2020-12-30T01:01:02.000Z',
    scan_url: 'StaticOverview:74838:747084:10187958:10162699:10178362',
    internal_status: 'resultsready'
  }
]

*/


/*
[ { '$': { analysis_type: 'Static', status: 'Incomplete' } } ]
[ { '$': { analysis_type: 'Static', status: 'Pre-Scan Submitted' } } ]
[
  {
    '$': {
      analysis_type: 'Static',
      status: 'Scan In Process',
      eta_status: 'Current',
      estimated_scan_hours: '1',
      estimated_delivery_date: '2020-12-30T09:00:00-05:00',
      engine_version: '20201206173220'
    }
  }
]
[
  {
    '$': {
      analysis_type: 'Static',
      status: 'Scan In Process',
      engine_version: '20201206173220'
    }
  }
]
[
  {
    '$': {
      analysis_type: 'Static',
      published_date: '2020-12-30T00:56:50-05:00',
      published_date_sec: '1609307810',
      status: 'Results Ready',
      engine_version: '20201206173220'
    }
  }
]
*/

//testGetAppByID();
//testSandboxesList();
//testSandboxLastScanStatus();
//testAppBuildInfo();
testSandboxBuildInfo();

