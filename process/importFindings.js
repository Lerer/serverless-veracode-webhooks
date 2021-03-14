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
		const recordBody = JSON.parse(record.body);
		console.log(recordBody);
		if (recordBody.github_event === 'check_run' && recordBody.check_run && recordBody.check_run.external_id) {
            const context = recordBody.check_run.external_id.split(':');
            if (context.length===3) {
                //const findings = await findingsAPIHandler.getScanFindings(context[0],context[1],context[2]);
                let scanFindings = await getVeracodeFindings(context[0],context[1],context[2]);
                if (scanFindings && scanFindings.length>0) {
                    // set repeated vars
                    const owner = recordBody.repository.owner.login;
                    const repo = recordBody.repository.name;
                    //let scanFindings = findings._embedded.findings;
                    // gather existing open issues - to prevent duplication
                    const existingIssues = await collectExistingOpenIssues(owner,repo);
                    // If issues already exists, remove them from the findings
                    if (existingIssues.length>0) {
                        scanFindings = cleanExistingIssuesFromFindings(scanFindings,existingIssues);
                    }
                    // process array for issue creation
                    const parsedFindingsArray = processFindings(scanFindings);
                    console.log(`parsed findings for creation: ${parsedFindingsArray.length}`);
                    // verify veracode labels
                    await verifyLabels(owner,repo);
                    // create the issues themselves
                    await createGithubIssues(owner,repo,parsedFindingsArray);
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

const getVeracodeFindings = async (appGUID,sandboxGUID,buildID) => {
    console.log('getVeracodeFindings - START');
    let findings = [];
    let page = 0;
    while (page>-1 && page<5) {
        const findingsReq = await findingsAPIHandler.getScanFindings(appGUID,sandboxGUID,buildID,page,2);
        if (findingsReq && findingsReq._embedded && findingsReq._embedded.findings) {
            console.log(`returned ${findingsReq._embedded.findings.length} findings`)
            findings = findings.concat(findingsReq._embedded.findings);
            console.log(findingsReq.page);
            if (findingsReq.page.number <findingsReq.page.total_pages-1) {
                page++;
            } else {
                page = -1;
            }
        } else {
            console.log(findingsReq);
            page = -10;
        }
        console.log(`Total accumulated issues: ${findings.length}`);
    }
    console.log('getVeracodeFindings - END');
    return findings;
}

const processFindings = (findingsArray) => {
    if (typeof findingsArray !== 'object') {
        console.log(`Error trying to process findings where input is ${typeof findingsArray}`)
    }
    return findingsArray.map((finding) => parseStaticScanIssue(finding));
}

const parseStaticScanIssue = (finding) => {
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
                    references = `${references}- [${text[0].substring(2)}](${link[0].substring(0,link[0].length-2)})   \n`;
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

    return {
        title: finding.finding_details.cwe.name,
        description: `${details}  \n  \n${references}${metadata}`,
        id: finding.issue_id,
        labels: getLabels4SevInt(finding.finding_details.severity)
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

const getLabels4SevInt = (sevInt) => {
    if (Number.isNaN(sevInt) || sevInt>5 || sevInt<0) {
        console.error(`Wrong severity: ${sevInt}`);
        return [githubLabelsHandler.LABELS.veracode.name];
    }
    const sevStruct = githubLabelsHandler.LABELS.severities.filter((sevObj) => sevObj.severity===sevInt);

    return [githubLabelsHandler.LABELS.veracode.name,sevStruct[0].name];
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
    openIssues = openIssues.filter((item) => {
        return (item>0);
    })
    console.log(`Existing Open issues: ${openIssues}`);
    return openIssues;
}

const cleanExistingIssuesFromFindings = (scanFindings,existingIssues) => {
    return scanFindings.filter((finding) => {
        return !existingIssues.includes(parseInt(finding.issue_id));
    });
}

const createGithubIssues = async (owner,repo,parsedIssuesArray) => {
    console.log('createGithubIssues - START');
    console.log(`creating ${parsedIssuesArray.length} issues`);
    for (let issueDetails of parsedIssuesArray) {
        console.log(JSON.stringify(issueDetails));  
        await githubIssuesHandler.createIssue(owner,repo,issueDetails);
    }
    console.log('createGithubIssues - END');
}


module.exports = {
    handleEvent
}