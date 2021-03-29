const slackMessageHandler = require('../util/apis/slack/message');
const jsonHandler = require('../util/helper/jsonUtil');

const emulateHello = async () => {
    const result = await slackMessageHandler.messageSlack('hello');
    console.log(jsonHandler.getNested(result.data));

    if (jsonHandler.getNested(result.data)!=='ok') {
        process.exit(1);
    }
};

emulateHello();