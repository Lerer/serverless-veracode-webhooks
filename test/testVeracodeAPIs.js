const buildSummaryHandler = require("../util/apis/veracode/buildSummary");

const testBuildSummary = async () => {
    const summary = await buildSummaryHandler.getBuildSummary('6cb54471-ed14-4ebc-a1a7-54987a40dcb4',undefined,'10288400') 
    console.log(summary);

    const summaryMD = buildSummaryHandler.getBuildSummaryMarkDown(summary);
    console.log(summaryMD);
}


testBuildSummary();