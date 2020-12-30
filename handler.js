'use strict';

const AWS = require('aws-sdk');
const appList = require('./util/apis/applist');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/MyQueue`;

exports.checkScanStatus = (event,context,callback) => {

	var paramsNew = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    DelaySeconds: 5,
	    MessageAttributes: {
			"Origin": {
		   		DataType: "String",
		   		StringValue: "GitHub"
		 	},
		 	"Target": {
		   		DataType: "String",
		   		StringValue: "Veracode SAST"
		 	},
		 	"Check_Interval": {
				DataType: "Number",
				StringValue: "4"
		 	}
	   	},
	   	MessageBody: "Check scan for application ABC",
	   	// MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
	   	// MessageGroupId: "Group1",  // Required for FIFO queues
	   	QueueUrl: QUEUE_URL
	 };
	 
	console.log('before SQS');

	const responseBody = {
		baseMessage: "Go Serverless v2.0! Your function executed successfully!",
		message: ""
    };
	let responseCode = 200;
	sqs.sendMessage(paramsNew, function(err, data) {
		console.log('in SQS');
	   	if (err) {
			console.log("Error", `failed to send message: \"${err}\"`);
			responseCode = 500;
	   	} else {
			console.log("Success: ", data.MessageId);
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
	console.log('it was called');

	console.log(event);
	const records = event.Records;
	const event0Attrs = records[0].messageAttributes;
	console.log(records);
	console.log(event0Attrs);
	const apps = await appList.getApplications();
	console.log(`Applications: ${JSON.stringify(apps)}`);
	//context.done(null, '');
};

