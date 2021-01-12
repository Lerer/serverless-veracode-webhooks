'use strict';

const AWS = require('aws-sdk')
const scanCheckEventHandler = require('./process/scanCheckEventHandler');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ScanChecks`;

exports.checkScanStatus = (event,context,callback) => {
	console.log(event);
	if (!event.pathParameters || !event.pathParameters.appGUID) {
		return callback(null, {
			headers: {
				"Content-Type": "application/json",
			},
			statusCode: 400,
			body: "Missing GUID path parameter for the application ID"
	  	});
	}

	console.log(event.pathParameters);
	console.log(event.pathParameters.appGUID);

	const msgAttrs = {
		"Origin": {
			   DataType: "String",
			   StringValue: "GitHub"
		 },
		//  "Target": {
		// 	   DataType: "String",
		// 	   StringValue: "Veracode SAST"
		//  },
		//  "Check_Interval": {
		// 	DataType: "Number",
		// 	StringValue: "4"
		// },
		"appGUID": {
			DataType: "String",
			StringValue: event.pathParameters.appGUID
		},
		// "appLegacyID": {
		// 	DataType: "Number",
		// 	StringValue: "0"
		// },
	};

	if (event.pathParameters.sandboxGUID) {
		msgAttrs.sandboxGUID = {
			DataType: "String",
			StringValue: event.pathParameters.sandboxGUID
		}
	}

	var paramsNew = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    DelaySeconds: 5,
	    MessageAttributes: msgAttrs,
	   	MessageBody: "Track Scan Status",
	   	// MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
	   	// MessageGroupId: "Group1",  // Required for FIFO queues
	   	QueueUrl: QUEUE_URL
	};
	 
	const responseBody = {
		baseMessage: "Go Serverless v2.0! Your function executed successfully!",
		message: ""
    };
	let responseCode = 200;
	sqs.sendMessage(paramsNew, function(err, data) {
		console.log('Sending SQS Message');
	   	if (err) {
			console.log("Error", `failed to send message: \"${err}\"`);
			responseCode = 500;
	   	} else {
			console.log("Message sent: ", data.MessageId);
			responseBody.message = `Sent to ${QUEUE_URL}`;
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
};

exports.sqsSingleScanSample = async (event, context, callback) => {
	console.log('sqsSingleScanSample was called');
	await scanCheckEventHandler.handleEvent(event);
}

