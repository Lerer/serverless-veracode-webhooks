const apiUtil = require('../../helper/apiQueryHandler');

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
    } catch (error) {
        console.error(error.response);
    }
    console.info('end getSandbox');
    return application;
}

const getSandboxByName = async (appGUID,sandboxName) => {
    console.info('getSandboxByName - START');
    let sandbox = {};
    try {
        const response = await apiUtil.request('GET','api.veracode.com',`/appsec/v1/applications/${appGUID}/sandboxes`,null);
        let sandboxes = response.data;
        if (sandboxes._embedded && sandboxes._embedded.sandboxes) {
            sandboxes = sandboxes._embedded.sandboxes.filter((sandboxElement) => {
                return (sandboxElement.name === sandboxName);
            })
        }
        if (sandboxes.length===1){
            sandbox = sandboxes[0];
        } else {
            console.info(`getSandboxByName - Could not find the sandbox ny name [${sandboxName}]`);
        }
        console.log(sandbox);
    } catch (error) {
        console.error(error);
    }
    console.info('getSandboxByName - END');
    return sandbox;
}

module.exports = {
    getSandboxByGUID : getSandbox,
    getSandboxesByAppGUID : getSandboxes,
    getSandboxByName
}
