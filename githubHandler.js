'use strict';

// const AWS = require('aws-sdk')

// const AWS_ACCOUNT = process.env.ACCOUNT_ID;
// const AWS_REGION = process.env.TARGET_REGION;

// // Set the region
// AWS.config.update({region: AWS_REGION});



exports.webhookListen = (event,context,callback) => {
	console.log(event);
	const response = {
        headers: {
            "Content-Type": "application/json",
        },
        statusCode: 200,
        body: "Nothing"
    };
    callback(null,response);
}