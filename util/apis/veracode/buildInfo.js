const apiUtil = require('../../helper/apiQueryHandler');
const xml2js = require('xml2js');

const STATUS = {
    INCOMPLETE:"Incomplete",
    SCAN_IN_PROGRESS: "Scan In Process",
    PRESCAN_SUBMITTED: "Pre-Scan Submitted",
    PRESCAN_FINISHED: "Pre-Scan Success",
    SUBMITTED_TO_SCAN:'Submitted to Engine',
    RESULT_READY: "Results Ready"
};

const getBuildInfo = async (appLegacyId,sandboxLegacyId) => {
    console.log('getBuildInfo - START');
    let jsonBuildInfo = {};
    let params = {
        'app_id':appLegacyId+''
    };
    if (sandboxLegacyId && sandboxLegacyId!==null) {
        params.sandbox_id = sandboxLegacyId+'';
    }
    try {
        const response = await apiUtil.request(
            'GET',
            'analysiscenter.veracode.com',
            '/api/5.0/getbuildinfo.do', 
            params
        );
        const buildInfo = response.data;
        xml2js.parseString(buildInfo,{explicitArray:false,trim:true},(err,result)=> {
            jsonBuildInfo = result.buildinfo.build;
        });

    } catch (error) {
        console.error(error.response);
    }
    console.log('getBuildInfo - END');
    return jsonBuildInfo;
}

module.exports = {
    getAppbuildInfo : getBuildInfo,
    STATUS
}
