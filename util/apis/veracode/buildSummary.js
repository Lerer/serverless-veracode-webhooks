const apiUtil = require('../../helper/apiQueryHandler');

const POLICY_COMPLIANCE = {
  PASS: 'Pass',
  DID_NOT_PASS: 'Did Not Pass',
  CONDITIONAL_PASS:'Conditional Pass',
  CALCULATING: 'Calculating...',
  NOT_ASSESSED: 'Not Assessed'
}

const SCA_SUMMARY_SECTION = 'software_composition_analysis';
const STATIC_SUMMARY_SECTION = 'static-analysis';

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
        
    } catch (e) {
        console.log(e.message, e);
        console.log(JSON.stringify(e,null,2));
    }
    console.log('getBuildSummary - END');
    return jsonBuildSummary;
}

const getParseBuildSummary = async (orgID,appID,appGUID,sandboxGUID,buildId,buildInfo) => {
  const response = {
    summary: {},
    summaryMD: 'N/A',
    textMD: 'Could not fetch build summary!',
    summaryCompliance: POLICY_COMPLIANCE.NOT_ASSESSED
  };
  const summary = await getBuildSummary(appGUID,sandboxGUID,buildId);
  console.log(summary);
  response.summary = summary;
  if (summary && summary[STATIC_SUMMARY_SECTION] && summary[STATIC_SUMMARY_SECTION].published_date && summary[STATIC_SUMMARY_SECTION].published_date.length>0) {
    const reportLink = `[View Report](https://analysiscenter.veracode.com/auth/index.jsp#ViewReportsResultSummary:${orgID}:${appID}:${buildId})`;
    const summaryMD = getBuildSummaryMarkDown(summary,reportLink,buildInfo);
    const textMD = getBuildSumaryDetails(summary);
    response.summaryMD = summaryMD;
    response.textMD = textMD;
    response.summaryCompliance = summary.policy_compliance_status;


  } else {
    console.log(`Could not find summary report for build ${buildId}`);
  }
  return response;
};

const getBuildSummaryMarkDown = (buildSummary,reportLink,buildInfo) => {

    const policyComplianceStatus = buildSummary.policy_compliance_status;
    let summaryHeading = `> Veracode Application: __${buildSummary.app_name}__  `;
    if (buildSummary.sandbox_name && buildSummary.sandbox_name.length>0) {

      summaryHeading = `${summaryHeading}\n> Sandbox name: __${buildSummary.sandbox_name}__  `;
    }
    summaryHeading = `${summaryHeading}\n> Policy name: __${buildSummary.policy_name}__  `;
    summaryHeading = `${summaryHeading}\n> Compliance status: __${policyComplianceStatus}__   \n`;
    

    const icon = policyIconMd(policyComplianceStatus);

    const staticSummary = parseSummary(buildSummary.severity);
    const changes = parseChanges(buildSummary['flaw-status']);
    const scaSummary = parseSCASummary(buildSummary[SCA_SUMMARY_SECTION]);

    let outputSummary = `${summaryHeading}  \n  ${icon}  \n  ${reportLink}  \n  ${staticSummary}  \n\n  ${changes}`;
    if (scaSummary && scaSummary.length>0) {
      outputSummary = `${outputSummary}  \n\n  ${scaSummary}`;
    }
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
  let summary = '## Static Scan Summary:  \nSeverity | Total \n --- | ---:'
  severities.map(sev => {
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

const parseSCASummary = (SCASummary) => {
  if (SCASummary && SCASummary['third_party_components'] && SCASummary['third_party_components']>0) {
    let scaSummary = '## Software Composition Analysis Summary:  \n';
    scaSummary = `${scaSummary} - Total detected 3rd Party Components: ${SCASummary['third_party_components']}\n`;
    scaSummary = `${scaSummary} - Components Violating Policy: ${SCASummary['components_violated_policy']}\n`;
    scaSummary = `${scaSummary} - Overall SCA Violating Policy: __${SCASummary['violate_policy']}__\n`;
    return scaSummary;
  } else {
    return '';
  }
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
