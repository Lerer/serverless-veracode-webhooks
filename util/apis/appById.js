const apiUtil = require('../helper/apiQueryHandler');

const getApplication = async (legacyAppId) => {
    // legacy_id
    console.info('getApplicationByLegacyId');
    let application = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com','/appsec/v1/applications', {'legacy_id':legacyAppId+''});
        application = response.data;
        //console.log(response.data._embedded);
    } catch (error) {
        console.error(error.response);
        //console.error(error);
    }
    console.info('end getApplicationByLegacyId');
    return application;
}

module.exports = {
    getApplicationByLegacyId : getApplication
}