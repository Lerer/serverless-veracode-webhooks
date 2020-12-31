const apiUtil = require('../helper/apiQueryHandler');

const getSandboxes = async (appGUID) => {
    console.log('getSandboxes');
    let sandboxes = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com',`/appsec/v1/applications/${appGUID}/sandboxes`, null);
        sandboxes = response.data;
        console.log(response.data);
    } catch (error) {
        console.error(error.response);
    }
    console.log('end getSandboxes');
    return sandboxes;
}

const getSandbox = async (appGUID,sandboxGUID) => {
    // legacy_id
    console.info('getSandbox');
    let application = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com',`/appsec/v1/applications/${appGUID}/sandboxes/${sandboxGUID}`,null);
        application = response.data;
        //console.log(response.data._embedded);
    } catch (error) {
        console.error(error.response);
        //console.error(error);
    }
    console.info('end getSandbox');
    return application;
}

module.exports = {
    getSandboxByGUID : getSandbox,
    getSandboxesByAppGUID : getSandboxes
}
