const veracodeHmac = require('./veracode-hmac');
const credHandler = require('./credsHandler');
const Axios = require('axios');

const USER_AGENT = 'veracode-lambda-function';
const PROTOCOL = 'https://';
const DEFAULT_METHOD = 'GET';

const request = (inputMethod,host,path, params) => {
    console.log('api query handler');
    let method = inputMethod || DEFAULT_METHOD; 
    // funky for the Veracode HMAC generation
    let queryString = '';
    if(params !== null && Object.keys(params).length>0) {
        var keys = Object.keys(params);
        queryString = '?';
        let index = 0;
        for(var key in keys)
        {   
            if(index > 0)
                queryString += '&';
            //console.log(params[keys[key]]);
            queryString += keys[key] + '=' + (params[keys[key]]).replace(/\s/g, "+");// params[keys[key]];
            index++;
        }
    }
    //console.log('before Axios.request');
    const authHeader = veracodeHmac.generateHeader(
        credHandler.getApiId()||'', 
        credHandler.getApiKey()||'', 
        host, path,
        queryString,
        method);
    console.log(`Requesting: ${method} ${PROTOCOL + host + path}`);
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
    