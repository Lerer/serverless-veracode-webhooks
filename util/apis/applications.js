const apiUtil = require('../helper/apiQueryHandler');

const getApplications = async () => {
    console.log('getApplications');
    let applications = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com','/appsec/v1/applications', null);
        applications = response.data;
        console.log(response.data);
    } catch (error) {
        console.log(error.response);
    }
    console.log('end getApplications');
    return applications;
}

const getApplicationById = async (appId) => {
    console.log('getApplicationById');
    let application = {};
    if (appId && appId!==null && appId.length>0){
        try {
            const response = await apiUtil.request('GET','api.veracode.com',`/appsec/v1/applications/${appId}`, null);
            application = response.data;
            console.log(response.data);
        } catch (error) {
            console.log(error.response);
        }
    }
    console.log('end getApplicationById');
    return application;
}

const getApplicationByLegacyId = async (legacyAppId) => {
    // legacy_id
    console.info('getApplicationByLegacyId');
    let application = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com','/appsec/v1/applications', {'legacy_id':legacyAppId+''});
        application = response.data;
        //console.log(response.data._embedded);
    } catch (error) {
        console.log(error.response);
        //console.error(error);
    }
    console.info('end getApplicationByLegacyId');
    return application;
}

module.exports = {
    getApplicationByLegacyId : getApplicationByLegacyId,
    getApplications : getApplications,
    getApplicationById: getApplicationById
}
