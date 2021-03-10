'use strict';

const AWS = require('aws-sdk')

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

const SCAN_CHECK_QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/ScanChecks`;

exports.webhookListen = (event,context,callback) => {
    console.log(event);
    const body = JSON.parse(event.body); 
	console.log(`BODY:\n${body}`);
    body.github_event = event.headers['x-github-event'] || event.headers['X-GitHub-Event'];
    console.log(`Event: ${body.github_event}`);
    if (!body.repository || !body.repository.owner || (!body.data && body.github_event!=='check_run')) {
        //console.log(event);
        return callback(null, {
			headers: {
				"Content-Type": "application/json",
			},
			statusCode: 400,
			body: "Not the right event"
	  	});

	} else {
        console.log('Event for Github scan check');
    }

    const msgAttrs = {
		"Origin": {
			   DataType: "String",
			   StringValue: "GitHub"
		 },
		"appName": {
            DataType: "String",
            StringValue: body.data.veracode_app_name
        }
    };
	
    if (body.data.veracode_sandbox_name && body.data.veracode_sandbox_name.length >0) {
		msgAttrs.sandboxName = {
			DataType: "String",
			StringValue: body.data.veracode_sandbox_name
		}
    }
    
    const params = {
		// Remove DelaySeconds parameter and value for FIFO queues
	    //DelaySeconds: 5,
	    MessageAttributes: msgAttrs,
	   	MessageBody: JSON.stringify(body),
	   	QueueUrl: SCAN_CHECK_QUEUE_URL
    };

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
			responseBody.message = `Sent to ${SCAN_CHECK_QUEUE_URL}`;
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



