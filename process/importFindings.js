const findingsAPIHandler = require('../util/apis/veracode/findings');

const checkRun = require('../util/apis/github/checkRun');

/*
 handle Import findings to and existing GitHub check run
 
 
*/
const handleEvent = async (customEvent) => {
    console.log('Import Findings Event Handler - START');
    const records = customEvent.Records;
	if (records.length>1) {
		console.log('Got more than one message!!!');
	}
	for (let record of records) {
		//const eventAttrs = record.messageAttributes;
		const recordBody = JSON.parse(record.body);
		console.log(recordBody);
		if (recordBody.github_event === 'check_run' && recordBody.check_run && recordBody.check_run.external_id) {
            const context = recordBody.check_run.external_id.split(':');
            console.log(`context: ${context}`);
            if (context.length===3) {
                const findings = await findingsAPIHandler.getScanFindings(context[0],context[1],context[2]);
                console.log(JSON.stringify(findings));
            } else {
                console.log(`wrong context value: ${recordBody.check_run.external_id}`);
            }
        } else {
            console.log('Wrong event to handle or missing external id for veracode related context');
        }
    }
    console.log('Import Findings Event Handler - END');
}


module.exports = {
    handleEvent
}