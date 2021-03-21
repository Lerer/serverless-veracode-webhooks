'use strict';

const jsonUtil = require('./util/helper/jsonUtil');

const AWS = require('aws-sdk')

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

const SCAN_CHECK_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ScanChecks`;
const IMPORT_FINDINGS_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ImportFindings`;

exports.webhookListen = (event,context,callback) => {
    console.log(event);
    const body = JSON.parse(event.body); 
	console.log(`BODY:\n${body}`);
    body.github_event = event.headers['x-github-event'] || event.headers['X-GitHub-Event'];
    console.log(`Event: ${body.github_event}`);
    if (!jsonUtil.getNested(body,'repository','owner') || (!body.data && body.github_event!=='check_run')) {

		return callback(null, {
			headers: {
				"Content-Type": "application/json",
			},
			statusCode: 400,
			body: "Not the right event"
	  	});

	} 

    const msgAttrs = {
		...enrichMessageAttrs(body.data),
		"Origin": {
			   DataType: "String",
			   StringValue: "GitHub"
		 }
	};

	const params = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    //DelaySeconds: 5,
	    MessageAttributes: msgAttrs,
	   	MessageBody: JSON.stringify(body),
	   	QueueUrl: SCAN_CHECK_QUEUE_URL
    };

	if (body.github_event==='check_run') {
		if (jsonUtil.getNested(body,'requested_action','identifier') === 'import_findings') {
			params.QueueUrl = IMPORT_FINDINGS_QUEUE_URL;
		} else {
			console.log(`Error - unknown action identifier`);
		}
	}

    const responseBody = {
		baseMessage: "Process Github request for Veracode Scan check!",
		message: ""
    };
    let responseCode = 200;
    
    // Create an SQS service object
    const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

    sqs.sendMessage(params, function(err, data) {
		console.log('Sending SQS Message');
	   	if (err) {
			console.log("Error", `failed to send message: \"${err}\"`);
			responseCode = 500;
	   	} else {
			console.log("Message sent: ", data.MessageId);
			responseBody.message = `Sent to ${params.QueueUrl}`;
        	responseBody.messageId = data.MessageId;
	   	}
	   	const response = {
			headers: {
				"Content-Type": "application/json",
			},
			statusCode: responseCode,
			body: JSON.stringify(
				responseBody
			)
	  	};
	   	callback(null,response);
	});
}


const enrichMessageAttrs = (bodyData) => {
	let enrichingData = {};
	if (bodyData) {
		if (bodyData.veracode_app_name) {
			enrichingData.appName = {
					DataType: "String",
					StringValue: bodyData.veracode_app_name
			};
		}

		if (bodyData.veracode_sandbox_name && bodyData.veracode_sandbox_name.length >0) {
			enrichingData.sandboxName = {
				DataType: "String",
				StringValue: bodyData.veracode_sandbox_name
			}
		}
	}
	return enrichingData;
}



