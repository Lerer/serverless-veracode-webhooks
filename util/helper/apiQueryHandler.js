const veracodeHmac = require('./veracode-hmac');
const credHandler = require('./credsHandler');
const Axios = require('axios');

const USER_AGENT = 'veracode-lambda-function';
const PROTOCOL = 'https://';
const DEFAULT_METHOD = 'GET';

const request = (inputMethod,host,path, params) => {
    let method = inputMethod || DEFAULT_METHOD; 
    // funky for the Veracode HMAC generation
    let queryString = '';
    if(params !== null && Object.keys(params).length>0) {
        const preJoined = Object.entries(params).map(([key, val]) => {
            return `${key}=${String(val).replace(/\s/g, "+")}`;
        });
        
        queryString = '?' + preJoined.join('&');
    }

    const authHeader = veracodeHmac.generateHeader(
        credHandler.getApiId()||'', 
        credHandler.getApiKey()||'', 
        host, path,
        queryString,
        method);
    console.log(`Requesting: [${method} ${PROTOCOL + host + path}] with params: ${JSON.stringify(params)}`);
    return Axios.request({
        method,
        headers:{
            'User-Agent': USER_AGENT,
            'Authorization': authHeader
        },
        params,
        url: PROTOCOL + host + path
    });
}

exports.request = request;
    