const appsHandler = require('../util/apis/applications');

const handleEvent = async (customEvent) => {
    const records = customEvent.Records;
	if (records.length>1) {
		console.log('Got more than one message!!!');
	}
	for (let record of records) {
		const eventAttrs = record.messageAttributes;
		console.log(eventAttrs);
		const app = await appsHandler.getApplicationById(eventAttrs.appGUID.stringValue);
		console.log(`Application: ${JSON.stringify(app)}`);
	}
}

module.exports = {
    handleEvent
}