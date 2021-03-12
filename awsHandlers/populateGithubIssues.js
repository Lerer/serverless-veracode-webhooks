'use strict';

const importFindingsEventHandler = require('../process/importFindings');

exports.handler = async (event, context, callback) => {
	console.log('sqsSingleScanSample was called');
	await importFindingsEventHandler.handleEvent(event);
}

