const appsHandler = require('../util/apis/veracode/applications');
const sandboxHandler = require('../util/apis/veracode/sandboxes');
const buildInfoHandler = require('../util/apis/veracode/buildInfo');
const buildSummaryHandler = require('../util/apis/veracode/buildSummary');

const checkRun = require('../util/apis/github/checkRun');

const AWS = require('aws-sdk');
//const buildInfo = require('../util/apis/buildInfo');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

const RECHECK_ACTION = {
	STOP : -1,
	ERROR: -2,
	SCANNING: 20,
	FINISHED: -10,
	AWAITING_POLICY_CALCULATION: 20,
	LONGER_WAIT: 60,
	SHORTER_WAIT: 30
}

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const SCAN_CHECK_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ScanChecks`;
//const GITHUB_REPORT_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/GithubReportBack`;

/*
 handle ScanCheck event
 - iterate on the records captured:
	- if no lagacy id - resolve and requeue
	- if lagacy id exists - check scan status
		- if scan still running - requeue for another check
		- if scan done - finish
*/
const handleEvent = async (customEvent) => {
	console.log('handleEvent - START');
    const records = customEvent.Records;
	if (records.length>1) {
		console.log('Got more than one message!!!');
	}
	for (let record of records) {
		const eventAttrs = record.messageAttributes;
		const recordBody = JSON.parse(record.body);
		console.log(recordBody);
		let response = {};
		if (!eventAttrs.appLegacyID) {
			const sandboxName = eventAttrs.sandboxName ? eventAttrs.sandboxName.stringValue : undefined;
			//response = await getLagacyIDsFromGUID(eventAttrs.appGUID.stringValue,eventAttrs.sandboxGUID.stringValue || null); 
			response = await getLagacyIDsFromName(eventAttrs.appName.stringValue,sandboxName);
			console.log(response);
			if (response.appLegacyID && response.appLegacyID.stringValue!=='0') {
				eventAttrs.appLegacyID = response.appLegacyID;
				eventAttrs.appGUID = response.appGUID;
				eventAttrs.orgID = response.orgID;
			} else {
				console.log('Error - could not find application id');
				return;
			}
			if (response.sandboxLegacyID) {
				eventAttrs.sandboxLegacyID = response.sandboxLegacyID;
				eventAttrs.sandboxGUID = response.sandboxGUID;
			}

			// report and create a new check-run
			let sqsBaseMessage;
			if (recordBody.github_event === 'push') { 
				sqsBaseMessage = checkRun.baseSQSMessageFromGithubEvent(recordBody);
			} else if (recordBody.github_event === 'pull_request') {
				sqsBaseMessage = checkRun.baseSQSMessageFromGithubEvent(recordBody);
				sqsBaseMessage.commit_sha = recordBody.pull_request.head.sha;
			}

			if (sqsBaseMessage && sqsBaseMessage !== null) {
				const newCheckRun = await checkRun.createCheckRun(
					sqsBaseMessage.repository_owner_login,
					sqsBaseMessage.repository_name,
					sqsBaseMessage.commit_sha);
				console.log('New check run created');
				console.log(newCheckRun);

				// Adding the check run id to the sqs attributes
				eventAttrs.checkRunID = {
					dataType: "Number",
					stringValue: newCheckRun.data.id + ''
				}
				// requeue with lagacy ID
				console.log(eventAttrs);

				// re-queue with the lagacy ids;
				await requeueMessage(eventAttrs,RECHECK_ACTION.SCANNING,JSON.stringify({/*...newCheckRun,*/...sqsBaseMessage,check_run_id:newCheckRun.data.id}),SCAN_CHECK_QUEUE_URL);
				
				console.log('Finish updating with lagacy ids and requeue for scan check');
			} else {
				console.log(`Un supported github event type: ${recordBody.github_event}`);
			}

		} else {
			console.log('Starting to check for build info');
			// we can start the check of the build status
			const buildInfo = await getLatestBuildStatus(eventAttrs);
			//const buildInfo = response;
			let scanRecheckTime = RECHECK_ACTION.STOP;
			if (buildInfo['$'] && buildInfo.analysis_unit ) {
				scanRecheckTime = calculateRescanTimeFromAnalysisUnit(buildInfo.analysis_unit);
				// update with build id if not exist
				if (!eventAttrs.buildID) {
					eventAttrs.buildID = {
						dataType: "String",
						stringValue: buildInfo['$'].build_id
					}
				}
			};

			if (scanRecheckTime === RECHECK_ACTION.STOP) {
				const checkRunID = eventAttrs.checkRunID.stringValue;
				await checkRun.updateCheckRun(
					sqsBaseMessage.repository_owner_login,
					sqsBaseMessage.repository_name,
					checkRunID,{
						status: 'completed',
						conclusion: checkRun.CONCLUSION.SKIPPED,
						output: {
							summary: 'Issue with calculating recheck time. Bailing out!',
							title: checkRunHandler.TEST_RUN_TITLE,
						//	text: parsedSummary.textMD
						}
					});
			} else if (scanRecheckTime === RECHECK_ACTION.FINISHED) {
				//console.log(eventAttrs);
				const appID = eventAttrs.appLegacyID.stringValue;
				const orgID = eventAttrs.orgID.stringValue;
				const appGUID = eventAttrs.appGUID.stringValue;
				const sandboxGUID = eventAttrs.sandboxGUID ? eventAttrs.sandboxGUID.stringValue : undefined;
				// TODO - notify finished scan by updating the status
				console.log('===  record body start on finish ===')
				console.log(recordBody);
				console.log('===  record body finish on finish ===')
				// review compliance status
				const complianceStatus = buildInfo['$'].policy_compliance_status;
				// only update if needed
				if (!recordBody.pre_calculated_updated || complianceStatus!==buildSummaryHandler.POLICY_COMPLIANCE.CALCULATING) {
					const parsedSummary = await buildSummaryHandler.getParseBuildSummary(orgID,appID,appGUID,sandboxGUID,eventAttrs.buildID.stringValue,buildInfo);
					console.log(parsedSummary);
					const conclusion = calculateConclusion(complianceStatus,sandboxGUID); 
					console.log(`Current scan conclusion: '${conclusion}'`);
					const checkRunFinished = await checkRun.updateCheckRun(
						recordBody.repository_owner_login,
						recordBody.repository_name,
						recordBody.check_run_id,
						{	
							status: 'completed',
							conclusion,
							output: {
								summary: parsedSummary.summaryMD,
								title: checkRun.TEST_RUN_TITLE,
								text: parsedSummary.textMD
							}
						});
					console.log('Check run => updated with a complete status');
					console.log(checkRunFinished);
				}
				// if policy is not calculated, requeue again
				if (complianceStatus===buildSummaryHandler.POLICY_COMPLIANCE.CALCULATING) {
					await requeueMessage(
						eventAttrs,
						RECHECK_ACTION.AWAITING_POLICY_CALCULATION,
						JSON.stringify({...recordBody,previous_scan_status:buildInfoHandler.STATUS.RESULT_READY,pre_calculated_updated: true}),
						SCAN_CHECK_QUEUE_URL);
					console.log('Scan check finish - Re-queue for recheck as policy is being calculated');
				} else {
					console.log('Scan check finish - no recheck is required');
				}

			} else if (scanRecheckTime === RECHECK_ACTION.ERROR) {
				console.log(`Error canculating recheck time - check the scan status message`);
				const checkRunFailed = await checkRun.updateCheckRun(
					recordBody.repository_owner_login,
					recordBody.repository_name,
					recordBody.check_run_id,
					{	
						status: 'completed',
						conclusion: checkRun.CONCLUSION.FAILURE,
						output: {
							summary: `Unknow scan status: ${buildInfo.analysis_unit['$'].status}`,
							title: checkRun.TEST_RUN_TITLE
						}
					});
				console.log(checkRunFailed);
			} else if (scanRecheckTime > 0) {
				// Update if status changed
				if (buildInfo.analysis_unit['$'].status !== recordBody.previous_scan_status) {
					console.log(`Status changed from ${recordBody.previous_scan_status} to ${buildInfo.analysis_unit['$'].status} - sending update`)
					console.log(JSON.stringify(eventAttrs));
					const reportingStatus = getGithubStatusFromBuildStatus(buildInfo);
					const sandboxName = (eventAttrs.sandboxName && eventAttrs.sandboxName.stringValue) ? eventAttrs.sandboxName.stringValue : undefined;
					const checkRunUpdate = await checkRun.updateCheckRun(
						recordBody.repository_owner_login,
						recordBody.repository_name,
						recordBody.check_run_id,
						{	
							status: reportingStatus.status,
							conclusion: reportingStatus.conclusion,
							output: {
								title: checkRun.TEST_RUN_TITLE,
								summary: getStatusChangeSummary(eventAttrs.appName.stringValue,sandboxName, eventAttrs.buildID.stringValue),//`Build ${eventAttrs.buildID.stringValue} submitted. Awaiting scan results.`,
								text: `Veracode scan status update: ${buildInfo.analysis_unit['$'].status}`
							}
						});
					console.log(checkRunUpdate);
					console.log('Github check run updated');
				}
				// any other rescan action
				console.log(`requeuing message for another check in ${scanRecheckTime} seconds`);
				// requeue same message with an update on the current status as the latest status
				await requeueMessage(eventAttrs,scanRecheckTime,JSON.stringify({...recordBody,previous_scan_status:buildInfo.analysis_unit['$'].status}),SCAN_CHECK_QUEUE_URL);
			}
			// TODO - depend on status - 
			// - requeue the same message, 
			// - and/or requeue response to the sender
			//console.log('Finish process scan check');
		}
		//console.log(`Processing response: ${JSON.stringify(response)}`);
		//console.log('Finish process event record')
	}
	console.log('handleEvent - END')
}

const calculateConclusion = (complianceStatus, sandboxGUID) => {
	console.log(`calculateConclusion for : '${complianceStatus}'`)
	if (sandboxGUID && sandboxGUID !== null && sandboxGUID.length > 0) {
		return checkRun.CONCLUSION.NATURAL;
	} else if (complianceStatus===buildSummaryHandler.POLICY_COMPLIANCE.PASS) {
		return checkRun.CONCLUSION.SUCCESS;
	} else if (complianceStatus===buildSummaryHandler.POLICY_COMPLIANCE.CALCULATING) {
		return checkRun.CONCLUSION.NATURAL;
	} else {
		return checkRun.CONCLUSION.FAILURE;
	}
}

const getStatusChangeSummary = (appName,sandboxName,buildID) => {
    let summaryHeading = `> Veracode Application: __${appName}__  `;
    if (sandboxName && sandboxName.length>0) {
      summaryHeading = `${summaryHeading}\n> Sandbox name: __${sandboxName}__  `;
	}
	summaryHeading = `${summaryHeading}\n> Build ${buildID} submitted. Awaiting scan results...`;
    return summaryHeading;
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

const getLagacyIDsFromName = async (appName,sandboxName) => {
	const retVal = {
		appLegacyID : {
			dataType: "Number",
			stringValue: '0'
		}
	}

	let response = await appsHandler.getApplicationByName(appName);
	if (response.id) {
		console.log(`adding app legacy id: ${response.id}`);
		retVal.appLegacyID = {
			dataType: "Number",
			stringValue: response.id + ''
		};
		retVal.appGUID = {
			dataType: "String",
			stringValue: response.guid
		};
		retVal.orgID = {
			dataType: "Number",
			stringValue: response.oid + ''
		};
	} else {
		// No point to continue if app id is not found
		console.log('no id parameter in the response for get application by id');
		return retVal;
	}

	console.log(`Sandbox name to look for: ${sandboxName}`);
	// Identify sandbox details
	if (sandboxName && sandboxName!==null && sandboxName.length>0) {
		let sandboxInfo = await sandboxHandler.getSandboxByName(response.guid,sandboxName);
		if (sandboxInfo.id) {
			retVal.sandboxLegacyID = {
				dataType: "Number",
				stringValue: sandboxInfo.id + ''
			};
			retVal.sandboxGUID = {
				dataType: "String",
				stringValue: sandboxInfo.guid
			};
		}
		// TODO - add sandbox referance
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
	//console.log(buildInfo);

	return buildInfo;
}

const requeueMessage = async (msgAttrs,delay,msgBody,queueUrl) => {
	console.log('requeueMessage - START');
	// send a message to the queue
	//console.log(msgBody);

	var sqsPayload = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    DelaySeconds: delay || RECHECK_ACTION.SCANNING,
	    MessageAttributes: replaceSQSMessageAttr(msgAttrs),
	   	MessageBody: msgBody || "Track Scan Status",
	   	QueueUrl: queueUrl || SCAN_CHECK_QUEUE_URL
	};

	await sqs.sendMessage(sqsPayload).promise();
	console.log('requeueMessage - END');
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
	//console.log('calculateRescanTimeFromAnalysisUnit - START');
	let scanRecheckTime = RECHECK_ACTION.STOP;
	if (analysisUnit['$']) {
		const scanStatus = analysisUnit['$'].status;
		console.log(`calculateRescanTimeFromAnalysisUnit - Last scan status: '${scanStatus}'`);
		switch (scanStatus) {
			case buildInfoHandler.STATUS.RESULT_READY:
				// TODO - report scan done
				scanRecheckTime = RECHECK_ACTION.FINISHED;
				break;
			case buildInfoHandler.STATUS.INCOMPLETE:
				scanRecheckTime = RECHECK_ACTION.LONGER_WAIT;
				break;
			case buildInfoHandler.STATUS.SUBMITTED_TO_SCAN:
				scanRecheckTime = RECHECK_ACTION.SHORTER_WAIT;
				break;
			case buildInfoHandler.STATUS.PRESCAN_SUBMITTED:
			case buildInfoHandler.STATUS.PRESCAN_FINISHED:
				scanRecheckTime = RECHECK_ACTION.LONGER_WAIT;
				break;
			case buildInfoHandler.STATUS.SCAN_IN_PROGRESS:
				scanRecheckTime = RECHECK_ACTION.SCANNING;
				break;
			default:
				scanRecheckTime = RECHECK_ACTION.ERROR;
				console.log(`unknown scan status: [${scanStatus}]`);
		}
	} else {
		console.log(`no '$' element in analysisUnit`);
	}
	//console.log('calculateRescanTimeFromAnalysisUnit - END');
	return scanRecheckTime;
}

const getGithubStatusFromBuildStatus = (buildInfo) => {
	const status = {
		status: 'completed'
	}
	if (buildInfo && buildInfo.analysis_unit && buildInfo.analysis_unit['$']) {
		const buildStatus = buildInfo.analysis_unit['$'].status;
		switch (buildStatus) {
			case buildInfoHandler.STATUS.RESULT_READY:
				// TODO - report scan done
				status.conclusion = 'neutral';
				break;
			case buildInfoHandler.STATUS.INCOMPLETE:
			case buildInfoHandler.STATUS.PRESCAN_SUBMITTED:
			case buildInfoHandler.STATUS.SUBMITTED_TO_SCAN:
			case buildInfoHandler.STATUS.PRESCAN_FINISHED:
				status.status = 'queued';
				break;
			case buildInfoHandler.STATUS.SCAN_IN_PROGRESS:
				status.status = 'in_progress';
				break;
		}
	}

	return status;
}

module.exports = {
    handleEvent
}