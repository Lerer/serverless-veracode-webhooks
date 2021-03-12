const { Octokit } = require("@octokit/rest");
const { createAppAuth } = require("@octokit/auth-app");

const appId = process.env.GITHUB_APP_ID;
const installationId = process.env.GITHUB_APP_INSTALL_ID;
const begin = '-----BEGIN RSA PRIVATE KEY-----';
const end = '-----END RSA PRIVATE KEY-----';

const getAuthApp = async () => {
    console.log('getAuthApp - START');
    var pem = process.env.PEM;

    const content = pem.substring(begin.length,pem.length-end.length);

    const parsedPEM = begin + content.replace(/\s+/gi, "\n") + end;
    //console.log(parsedPEM.length);
  
    try {
        const appOctokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId,
                privateKey: parsedPEM,
                installationId,
            },
        });

        //const authRes = 
        await appOctokit.auth({
            type: "installation",
        });
        console.log('getAuthApp - END');
        return appOctokit;
    } catch (e) {
        console.log('getAuthApp - END ==   ERROR   ===============================');
        console.log(e);
    }
    return;
}

module.exports = {
    getAuthApp
}