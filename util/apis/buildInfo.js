const apiUtil = require('../helper/apiQueryHandler');
const xml2js = require('xml2js');

const getBuildInfo = async (appLegacyId,sandboxLegacyId) => {
    console.log('getBuildInfo');
    let buildInfo = '<null/>';
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
        buildInfo = response.data;
        let jsonData = {};
        xml2js.parseString(buildInfo,(err,result)=> {
            console.log('printing result');
            console.log(result.buildinfo.build);
            console.log(result.buildinfo.build[0].analysis_unit);
            jsonData = result;
            console.log('finish printing results');
        });
        //console.log(response.data);
        //console.log(jsonData);
    } catch (error) {
        console.error(error.response);
    }
    console.log('end getBuildInfo');
    return buildInfo;
}

module.exports = {
    getAppbuildInfo : getBuildInfo
}
