const apiUtil = require('../../helper/apiQueryHandler');

const getScanFindings = async (applicationGUID,sandboxGUID,buildId) => {
    console.log('getScanFindings - START');
    let jsonBuildSummary = {};
    
    try {
        
        const requestParameters = {
            violates_policy:true,
            size:1,
            scantype:'STATIC'
        };

        if (sandboxGUID) {
            requestParameters.context = sandboxGUID;
        }
        // if (buildId) {
        //     requestParameters.build_id = buildId;
        // }
        const response = await apiUtil.request(
            'GET',
            'api.veracode.com',
            `/appsec/v2/applications/${applicationGUID}/findings`, 
            requestParameters);
        jsonBuildSummary = response.data;
        
    } catch (e) {
        console.log('error');
        console.log(e.message, e);
        console.log(JSON.stringify(e,null,2));
    }
    console.log('getScanFindings - END');
    return jsonBuildSummary;
}

module.exports = {
  getScanFindings
};