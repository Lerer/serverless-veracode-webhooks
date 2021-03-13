'use strict';

const scanCheckEventHandler = require('./process/scanCheckEventHandler');

exports.sqsSingleScanSample = async (event, context, callback) => {
	console.log('sqsSingleScanSample was called');
	await scanCheckEventHandler.handleEvent(event);
}

