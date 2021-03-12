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
                //console.log(JSON.stringify(findings));
                if (findings._embedded && findings._embedded.findings) {
                    await processFindings(findings._embedded.findings);
                }
            } else {
                console.log(`wrong context value: ${recordBody.check_run.external_id}`);
            }
        } else {
            console.log('Wrong event to handle or missing external id for veracode related context');
        }
    }
    console.log('Import Findings Event Handler - END');
}

const processFindings = async (findingsArray) => {
    if (typeof findingsArray !== 'object') {
        console.log(`Error trying to process findings where input is ${typeof findingsArray}`)
    }
    //Const precreateIssuesArray = 
    return await findingsArray.map((finding) => parseStaticScanIssue(finding));
}

const parseStaticScanIssue = async (finding) => {
    console.log('parseStaticScanIssue - START');
    console.log(JSON.stringify(finding));
    console.log('parseStaticScanIssue - END');
}


module.exports = {
    handleEvent
}