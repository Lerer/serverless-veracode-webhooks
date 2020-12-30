const apiUtil = require('../helper/apiQueryHandler');

const getApplications = async () => {
    console.log('getApplications');
    let applications = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com','/appsec/v1/applications', null);
        applications = response.data;
        console.log(response.data);
    } catch (error) {
        console.error(error.response);
    }
    console.log('end getApplications');
    return applications;
}

exports.getApplications = getApplications;