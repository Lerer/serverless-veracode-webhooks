const appsHandler = require('../util/apis/applications');
const sandboxHandler = require('../util/apis/sandboxes');
const buildInfoHandler = require('../util/apis/buildInfo');

const AWS = require('aws-sdk');
const buildInfo = require('../util/apis/buildInfo');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

const RECHECK_ACTION = {
	STOP : -1,
	ERROR: -2,
	SCANNING: 12
}

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const SCAN_CHECK_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ScanChecks`;

const handleEvent = async (customEvent) => {
	console.log('handleEvent - START');
    const records = customEvent.Records;
	if (records.length>1) {
		console.log('Got more than one message!!!');
	}
	for (let record of records) {
		const eventAttrs = record.messageAttributes;
		console.log(eventAttrs);
		let response = {};
		if (!eventAttrs.appLegacyID) {	
			response = await getLagacyIDsFromGUID(eventAttrs.appGUID.stringValue,eventAttrs.sandboxGUID.stringValue || null); 
			if (response.appLegacyID && response.appLegacyID.StringValue!=='0') {
				eventAttrs.appLegacyID = response.appLegacyID;
			} else {
				console.log('Error - could not find application id');
				return;
			}
			if (response.sandboxLegacyID) {
				eventAttrs.sandboxLegacyID = response.sandboxLegacyID;
			}
			// requeue with lagacy ID
			console.log(eventAttrs);

			// re-queue with the lagacy ids;
			await requeueMessage(eventAttrs,RECHECK_ACTION.SCANNING,undefined,SCAN_CHECK_QUEUE_URL);

			console.log('Finish updating with lagacy ids and requeue for scan check');
		} else {
			// we can start the check of the build status
			response = await getLatestBuildStatus(eventAttrs);
			let scanRecheckTime = RECHECK_ACTION.STOP;
			if (response['$'] && response.analysis_unit ) {
				scanRecheckTime = calculateRescanTimeFromAnalysisUnit(response.analysis_unit);
			};

			if (scanRecheckTime === RECHECK_ACTION.STOP) {
				// TODO report back to sender
			} else if (scanRecheckTime === RECHECK_ACTION.ERROR) {
				console.log(`Error canculating recheck time - check the scan status message`);
			} else if (scanRecheckTime > 0) {
				console.log(`requeuing message for another check in ${scanRecheckTime} seconds`);
				await requeueMessage(eventAttrs,scanRecheckTime,undefined,SCAN_CHECK_QUEUE_URL);
			}
			// TODO - depend on status - 
			// - requeue the same message, 
			// - and/or requeue response to the sender
			console.log('Finish process scan check');
		}
		//console.log(`Processing response: ${JSON.stringify(response)}`);
		console.log('Finish process event record')
	}
	console.log('handleEvent - END')
}

const getLagacyIDsFromGUID = async (appGUID,sandboxGUID) => {
	const retVal = {
		appLegacyID : {
			dataType: "Number",
			stringValue: '0'
		}
	}

	let response = await appsHandler.getApplicationById(appGUID);
	if (response.id) {
		console.log(`adding app legacy id: ${response.id}`);
		retVal.appLegacyID = {
			dataType: "Number",
			stringValue: response.id + ''
		}
	} else {
		// No point to continue if app id is not found
		console.log('no id parameter in the response for get application by id');
		return retVal;
	}

	if (sandboxGUID && sandboxGUID!=null) {
		// get the sandbox id
		response = await sandboxHandler.getSandboxByGUID(appGUID,sandboxGUID);
		if (response.id) {
			console.log(`adding sandbox legacy id: ${response.id}`);
			retVal.sandboxLegacyID = {
				dataType: "Number",
				stringValue: response.id + ''
			}
		} else {
			console.log('no id parameter in the response for get sandbox by guid');
		}
	}
	return retVal
}

const getLatestBuildStatus = async (eventAttrs) => {
	// get the build status from the API
	const appId = eventAttrs.appLegacyID.stringValue;
	let sandboxId = null;
	if (eventAttrs.sandboxLegacyID) {
		sandboxId = eventAttrs.sandboxLegacyID.stringValue;
	}
	const buildInfo = await buildInfoHandler.getAppbuildInfo(appId,sandboxId);
	// log the build info
	console.log(buildInfo);

	return buildInfo;
}

const requeueMessage = async (msgAttrs,delay,msgBody,queueUrl) => {
	// send a message to the queue
	var sqsPayload = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    DelaySeconds: delay || RECHECK_ACTION.SCANNING,
	    MessageAttributes: replaceSQSMessageAttr(msgAttrs),
	   	MessageBody: msgBody || "Track Scan Status",
	   	QueueUrl: queueUrl || SCAN_CHECK_QUEUE_URL
	};

	await sqs.sendMessage(sqsPayload).promise();
}

const replaceSQSMessageAttr = (msgAttr) => {
	const newMsgAttr = {};
	for (let attr of Object.keys(msgAttr)) {
		const modAttr = {};
		modAttr.DataType = msgAttr[attr].dataType;
		modAttr.StringValue = msgAttr[attr].stringValue;
		newMsgAttr[attr] = modAttr;
	}
	return newMsgAttr;
}

const calculateRescanTimeFromAnalysisUnit = (analysisUnit) => {
	console.log('calculateRescanTimeFromAnalysisUnit - START');
	let scanRecheckTime = 0;
	if (analysisUnit['$']) {
		const scanStatus = analysisUnit['$'].status;
		console.log(`Last scan status: '${scanStatus}'`);
		switch (scanStatus) {
			case buildInfo.STATUS.RESULT_READY:
				// TODO - report scan done
				scanRecheckTime = -1;
				break;
			case buildInfo.STATUS.INCOMPLETE:
				scanRecheckTime = 60;
				break;
			case buildInfo.STATUS.PRESCAN_SUBMITTED:
				scanRecheckTime = 30;
				break;
			case buildInfo.STATUS.PRESCAN_FINISHED:
				scanRecheckTime = 60;
				break;
			case buildInfo.STATUS.SCAN_IN_PROGRESS:
				scanRecheckTime = 12;
				break;
			default:
				scanRecheckTime = -2
				console.log(`unknown scan status: [${scanStatus}]`);
		}
	} else {
		console.log(`no '$' element in analysisUnit`);
	}
	console.log('calculateRescanTimeFromAnalysisUnit - END');
	return scanRecheckTime;
}

module.exports = {
    handleEvent
}