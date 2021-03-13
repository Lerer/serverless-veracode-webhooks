const findingsAPIHandler = require('../util/apis/veracode/findings');

const githubLabelsHandler = require('../util/apis/github/labels')
const githubIssuesHandler = require('../util/apis/github/issues');


const metadataRegex = /\n<!-- lerer = (.*) -->/
const VID = 'vid';
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
            //console.log(`context: ${context}`);
            if (context.length===3) {
                const findings = await findingsAPIHandler.getScanFindings(context[0],context[1],context[2]);
                //console.log(JSON.stringify(findings));
                if (findings._embedded && findings._embedded.findings) {
                    // process array for issue creation
                    const parsedFindingsArray = await processFindings(findings._embedded.findings);
                    // verify veracode labels
                    const owner = recordBody.repository.owner.login;
                    const repo = recordBody.repository.name;
                    await verifyLabels(owner,repo);
                    // gather existing open issues - to prevent duplication
                    const existingIssues = await collectExistingOpenIssues(owner,repo);
                    // create the issues themselves
                    await createGithubIssues(owner,repo,parsedFindingsArray,existingIssues);
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
    return await findingsArray.map((finding) => parseStaticScanIssue(finding));
}

const parseStaticScanIssue = (finding) => {
    console.log('parseStaticScanIssue - START');
    let details = '### Description:  \n';
    let references = '### Identifiers:  \n';
    const sentences = finding.description.split(/<\/span>\s*/);
    sentences.map((sentence) => {
        const reduct = sentence.substring(6);
        const found = reduct.match(/^References:/g);
        if (found) {
            const refs = reduct.substring(12);
            const refs2 = refs.split(/<\/a>\s*/);

            refs2.map((ref) => {
                const link = ref.match(/http.*\">/);
                const text = ref.match(/">.*/);
                if (link && text)  {
                    references = `${references}- [${text[0].substring(2)}](${link[0].substring(0,link[0].length-2)}){:target="_blank"}  \n`;
                }
            })

        } else {
            details = `${details}  \n  \n${reduct}`;
        }
    });
 
    details = `${details}  \n- Veracode issue ID: ${finding.issue_id}`;
    details = `${details}  \n- Severity: ${intSev2Name(finding.finding_details.severity)}`;
    details = `${details}  \n- Location: ${finding.finding_details.file_path}:${finding.finding_details.file_line_number}`;
    details = `${details}  \n- Issue found on build: ${finding.build_id}`;
    details = `${details}  \n- Issue first found at: ${new Date(finding.finding_status.first_found_date).toUTCString()}`;
    details = `${details}  \n- Scanner: Veracode Static Application Security Testing`;
    
    const metadata = `\n\n<!-- lerer = {"${VID}":${finding.issue_id}} -->`;
    //console.log(JSON.stringify(finding));

    console.log('parseStaticScanIssue - END');
    return {
        title: finding.finding_details.cwe.name,
        description: `${details}  \n  \n${references}${metadata}`,
        id: finding.issue_id
    }; 
}

const intSev2Name = (sevInt) => {
    let sev = 'Unknown'
    switch (sevInt) {
        case 5:
            sev = 'Very High';
            break;
        case 4:
            sev = 'High';
            break;
        case 3:
            sev = 'Medium';
            break;
        case 2:
            sev = 'Low';
            break;
        case 1: 
            sev = 'Very Low';
            break;
        case 0:
            sev = 'Informational';
            break;
    }
    return sev;
}

const verifyLabels = async (owner,repo) => {
    const baseLabel = await githubLabelsHandler.getVeracodeLabel(owner,repo);
    
    if (!baseLabel || !baseLabel.data) {
        await githubLabelsHandler.createVeracodeLabels(owner,repo);
    }
}

const collectExistingOpenIssues  = async (owner,repo) => {
    let openIssues = [];
    let page = 1;
    while (page>0 && page <5) {
        const issues = await githubIssuesHandler.listRepoIssue(owner,repo,{
            state: 'open',
            labels: 'veracode',
            page
        });
        if (issues) {
            const ids = issues.data.map((issue) => {
                let id = 0;
                const match = issue.body.match(metadataRegex)

                if (match) {
                    const data = JSON.parse(match[1])
                    id = data[VID];
                    console.log(id);
                }
                return id;
            });
            openIssues = openIssues.concat(ids);

        }
        if (issues && (issues.data.length > 0) && issues.headers && issues.headers.link) {
            page++;
        } else {
            page = -1;
        }
    }

    console.log(openIssues);
    return openIssues;
}

const createGithubIssues = async (owner,repo,parsedIssuesArray,existingIssues) => {

    

    // for (let issueDetails of parsedIssuesArray) {
    //     console.log(issueDetails);
    //     console.log(JSON.stringify(issueDetails));
    //     await githubIssuesHandler.createIssue(owner,repo,issueDetails);
    // }
    //await githubIssuesHandler.searchRepoIssue(encodeURIComponent(`is:issue repo:${owner}/${repo} state:open`);
    // await githubIssuesHandler.listRepoIssue(owner,repo,{
    //     state: 'open',
    //     labels: 'veracode'
    // });
}


module.exports = {
    handleEvent
}