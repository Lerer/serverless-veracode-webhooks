
const Axios = require('axios');

const USER_AGENT = 'veracode-lambda-function';

const SLACK_URL = process.env.SLACK_UNIQUE_URL;

const messageSlack = async (message) => {
    if (!SLACK_URL || !message) {
        console.log('Slack URL is not configure');
        return;
    }

    return Axios.request({
        method:'POST',
        headers:{
            'User-Agent': USER_AGENT,
        },
        data:{"text":message},
        url: SLACK_URL,
    });
}

module.exports = {
    messageSlack
}
