'use strict';

const AWS = require('aws-sdk');

const AWS_ACCOUNT = process.env.ACCOUNT_ID;
const AWS_REGION = process.env.TARGET_REGION;

// Set the region
AWS.config.update({region: AWS_REGION});

// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const QUEUE_URL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT}/MyQueue`;

exports.hello = async function(event,context,callback) {
  const params = {
		MessageBody: "Shalom",
		QueueUrl: QUEUE_URL
	};

  sqs.sendMessage(params, function(err, data) {
		if (err) {
			console.log('error:', 'Fail Send Message' + err);

			const response = {
				statusCode: 500,
				body: JSON.stringify({
					message: 'ERROR'
				})
			};

			callback(null, response);
		} else {
			console.log('data:', data.MessageId);

			const response = {
				statusCode: 200,
				body: JSON.stringify({
					message: data.MessageId
				})
			};

			callback(null, response);
		}
	});

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}

exports.sqsHello = function (event, context, callback) {
	console.log('it was called');

	console.log(event);

	context.done(null, '');
}
