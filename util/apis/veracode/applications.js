const apiUtil = require('../../helper/apiQueryHandler');

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
            console.log(application);
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
    } catch (error) {
        console.log(error.response);
    }
    console.info('end getApplicationByLegacyId');
    return application;
}

const getApplicationByName = async (appName) => {
    // legacy_id
    console.info('getApplicationByName - START');
    let application = {};
    if (appName && appName.length>0) {
        try {
            const response = await apiUtil.request('GET','api.veracode.com','/appsec/v1/applications', {'name':appName});
            let applications = response.data;
            
            if (response.data._embedded && response.data._embedded.applications) {
                applications = response.data._embedded.applications.filter((app) => {
                    return (app.profile.name === appName);
                })
            }
            if (applications.length===1){
                application = applications[0];
            } else {
                console.info(`getApplicationByName - Could not find the application ny name [${appName}]`);
                console.log(response.data);
            }
            console.log(application);
        } catch (error) {
            console.log(error.response);
        }
    }
    console.info('getApplicationByName - END');
    return application;
}

module.exports = {
    getApplicationByLegacyId : getApplicationByLegacyId,
    getApplications : getApplications,
    getApplicationById: getApplicationById,
    getApplicationByName
}
