'use strict';

const AWS = require('aws-sdk');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/MyQueue`;

exports.queueMessage = async (event) => {
	const promise = new Promise((resolve, reject) => {
		const params = {
			MessageBody: "Shalom",
			QueueUrl: QUEUE_URL,
			//Label: 'Labeling_Shalom'
		};
	
		var paramsNew = {
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
	
		 const response = await sendMessage(paramsNew);
		 resolve(response);
	
	})
	return promise;
}

exports.hello = async (event,context,callback) => {
  	const params = {
		MessageBody: "Shalom",
		QueueUrl: QUEUE_URL,
		//Label: 'Labeling_Shalom'
	};


	console.log(params);
	console.log(sqs);

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

	 const response = await sendMessage(paramsNew);
	 callback(response);

	//  sqs.sendMessage(paramsNew, function(err, data) {
	// 	 console.log('in SQS');
	//    if (err) {
	// 	 console.log("Error", `failed to send message: \"${err}\"`);
	// 	 responseCode = 500;
	//    } else {
	// 	 console.log("Success: ", data.MessageId);
	// 	 responseBody.message = `Sent to ${QUEUE_URL}`;
    //      responseBody.messageId = data.MessageId;
	//    }
	//    const response = {
	// 	headers: {
	// 		"Content-Type": "application/json",
	// 	},
	// 	statusCode: responseCode,
	// 	body: JSON.stringify(
	// 		responseBody
	// 	)
	//   };
	//    callback(null,response);
	//  });
}

exports.sqsHello = async (event, context, callback) => {
	console.log('it was called');

	console.log(event);
	const records = event.Records;
	const event0Attrs = records[0].messageAttributes;
	console.log(records);
	console.log(event0Attrs);

	context.done(null, '');
}

const sendMessage = async (message) => {

	const response = {
		headers: {
			"Content-Type": "application/json",
		}
	};

	const responseBody = {
		baseMessage: "Go Serverless v2.0! Your function executed successfully!",
		message: ""
    };
	let responseCode = 200;
	
	await sqs.sendMessage(message, function(err, data) {
		console.log('in SQS');
	  	if (err) {
			console.log("Error", `failed to send message: \"${err}\"`);
			responseCode = 500;
		} else {
			console.log("Success: ", data.MessageId);
			responseBody.message = `Sent to ${QUEUE_URL}`;
			responseBody.messageId = data.MessageId;
		}
		// const response = {
		// 	headers: {
		// 		"Content-Type": "application/json",
		// 	},
		// 	statusCode: responseCode,
		// 	body: JSON.stringify(
		// 		responseBody
		// 	)
		// };
		response.statusCode = responseCode;
		response.body = JSON.stringify(
			responseBody
		);
	  //return response;
	});
	return response;
}
