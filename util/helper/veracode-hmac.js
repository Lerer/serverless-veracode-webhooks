const crypto = require("crypto");

function getAuthorizationScheme() { return "VERACODE-HMAC-SHA-256"; }
function getRequestVersion() { return "vcode_request_version_1"; }
function getNonceSize() { return 16; }

function hmac256 (data, key,format)  {
    let hash = crypto.createHmac('sha256', key).update(data);
	if (format===undefined){
        return hash.digest();
    } else {
        // no format = Buffer / byte array
        return hash.digest(format);
    }
}

function getByteArray(hex)  {
	var bytes = [] ;

	for(var i = 0; i < hex.length-1; i+=2){
	    bytes.push(parseInt(hex.substr(i, 2), 16));
	}

	// signed 8-bit integer array (byte array)
	return Int8Array.from(bytes);
}

function generateHeader (id, secret,host, urlPath,urlQueryParams, method) {
	urlPath += urlQueryParams;
	//console.log(`generateHeader for urlPath: ${urlPath}`);
    var data = `id=${id}&host=${host}&url=${urlPath}&method=${method}`;
	var timestamp = (new Date().getTime()).toString();
	var nonce = crypto.randomBytes(getNonceSize()).toString('hex');

	// calculate signature
	var hashedNonce = hmac256(getByteArray(nonce), getByteArray(secret),undefined);
	var hashedTimestamp = hmac256(timestamp, hashedNonce,undefined);
	var hashedVerStr = hmac256(getRequestVersion(), hashedTimestamp,undefined);
	var signature = hmac256(data, hashedVerStr, 'hex');

	return `${getAuthorizationScheme()} id=${id},ts=${timestamp},nonce=${nonce},sig=${signature}`;
}

exports.generateHeader = generateHeader;


