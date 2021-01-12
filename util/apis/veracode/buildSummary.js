const apiUtil = require('../../helper/apiQueryHandler');

const POLICY_COMPLIANCE = {
  PASS: 'Pass',
  DID_NOT_PASS: 'Did Not Pass',
  CONDITIONAL_PASS:'Conditional Pass',
  CALCULATING: 'Calculating...'
}

const getBuildSummary = async (appGUID,sandboxGUID,buildId) => {
    console.log('getBuildSummary - START');
    let jsonBuildSummary = {};
    
    try {
        
        const requestParameters = {};
        if (sandboxGUID) {
            requestParameters.context = sandboxGUID;
        }
        if (buildId) {
            requestParameters.build_id = buildId;
        }
        const response = await apiUtil.request('GET','api.veracode.com',
            `/appsec/v2/applications/${appGUID}/summary_report`, requestParameters);
            
        jsonBuildSummary = response.data;
        
        //console.log('getBuildSummary - printing result');
        //console.log(jsonBuildSummary);
        //console.log('getBuildSummary - finish printing results');
        
    } catch (e) {
        console.log(e.message, e)
    }
    console.log('getBuildSummary - END');
    return jsonBuildSummary;
}

const getParseBuildSummary = async (appGUID,sandboxGUID,buildId) => {
  const response = {
    summary: {},
    summaryMD: '',
    textMD: ''
  };
  const summary = await getBuildSummary(appGUID,sandboxGUID,buildId);
  //console.log(summary);
  response.summary = summary;
  if (summary && summary['static-analysis'].published_date && summary['static-analysis'].published_date.length>0) {
    
    const summaryMD = getBuildSummaryMarkDown(summary);
    const textMD = getBuildSumaryDetails(summary);
    response.summaryMD = summaryMD;
    response.textMD = textMD;
    
    console.log(textMD);
    console.log(summaryMD);
  } else {
    console.log(`Could not find summary report for build ${buildId}`);
  }
  return response;
};

const getBuildSummaryMarkDown = (buildSummary) => {
    let summaryHeading = `> Veracode Application: __${buildSummary.app_name}__  `;
    summaryHeading = `${summaryHeading}\n> Policy name: __${buildSummary.policy_name}__  `;
    summaryHeading = `${summaryHeading}\n> Compliance status: __${buildSummary.policy_compliance_status}__   \n`;

    const icon = policyIconMd(buildSummary.policy_compliance_status);

    const summary = parseSummary(buildSummary.severity);
    const changes = parseChanges(buildSummary['flaw-status']);

    // console.log(summary);
    let outputSummary = `${summaryHeading}  \n  ${icon}  \n  ${summary}  \n\n  ${changes}`;

    return outputSummary;
}

const getBuildSumaryDetails = (buildSummary) => {
    const staticAnalysisDetails = buildSummary['static-analysis'];
    let details = `- Build submitted: ${staticAnalysisDetails.submitted_date}   \n`;
    details = `${details}- Results published: ${staticAnalysisDetails.published_date}   \n`;
    details = `${details}- Scan score: ${staticAnalysisDetails.score}   \n`;
    details = `${details}- Scan submitter: ${buildSummary.submitter}   \n`;
    return details;
}

const parseSummary = (severities) => {
  let summary = 'Severity | Total \n --- | ---:'
  severities.map(sev => {
    // console.log(sev._attributes);
    //console.log(sev);
    const sevName = number2severity(sev.level)
    let totalForSev = 0
    let subCat = ''
    if (sev.category !== undefined) {
      if (Array.isArray(sev.category)) {
        sev.category.map(cat => {
            subCat = `${subCat}  \n&nbsp;&nbsp;&nbsp;&nbsp;${cat.categoryname} | ${cat.count}`;
            totalForSev = totalForSev + parseInt(cat.count)
        })
      } else {
        subCat = '\n   ' + sev.category.categoryname + ' | ' + sev.category.count
        totalForSev = parseInt(sev.category.count)
      }
    }
    summary = `${summary} \n**${sevName}** | **${totalForSev}** ${subCat}`;
  })

  return summary
}

const parseChanges = (flawStatus) => {
    let status = `|Flaw status  | |  \n :--- | ---: \n New | ${flawStatus.new}\n`;
    status = `${status} Open | ${flawStatus.open}\n`;
    status = `${status} Re-open | ${flawStatus.reopen}\n`;
    status = `${status} Fixed | ${flawStatus.fixed}\n`;
    status = `${status} Total | ${flawStatus.total}\n`;
    status = `${status} Not mitigated | ${flawStatus.not_mitigated}\n`;
    return status;
}

const number2severity = (numStr) => {
  if (numStr === 5) {
    return 'Very High'
  } else if (numStr === 4) {
    return 'High'
  } else if (numStr === 3) {
    return 'Medium'
  } else if (numStr === 2) {
    return 'Low'
  } else if (numStr === 1) {
    return 'Very Low'
  } else if (numStr === 0) {
    return 'Informational'
  }
}

const policyIconMd = (policyComplianceStatus) => {
  const iconPrefix = 'https://analysiscenter.veracode.com/images/policy/icon-shield' // -0.png'
  let iconType = '3';
  switch (policyComplianceStatus) {
    case POLICY_COMPLIANCE.PASS:
      iconType = 0;
      break;
    case POLICY_COMPLIANCE.DID_NOT_PASS:
      iconType = 2;
      break;
    case POLICY_COMPLIANCE.CONDITIONAL_PASS:
      iconType = 1;
      break;
    case POLICY_COMPLIANCE.CALCULATING:
      iconType = 4;
      break;
  }
  return `![alt text](${iconPrefix}-${iconType}.png "${policyComplianceStatus}")`;
}


module.exports = {
  getBuildSummary,
  getBuildSummaryMarkDown,
  getBuildSumaryDetails,
  getParseBuildSummary,
  POLICY_COMPLIANCE
};
