const githubAPIHandler = require('../../helper/githubAPIHandler');

const LABELS = {
    'severities':[
        {
            'name': 'Severity: Very High',
            'color': 'f71297',
            'description': 'A Veracode Flaw, Very High severity',
            'severity': 5
        },
        {
            'name': 'Severity: High',
            'color': 'd11141',
            'description': 'A Veracode Flaw, High severity',
            'severity': 4
        },
        {
            'name': 'Severity: Medium',
            'color': 'f37735',
            'description': 'A Veracode Flaw, Medium severity',
            'severity': 3
        },
        {
            'name': 'Severity: Low',
            'color': 'ffc425',
            'description': 'A Veracode Flaw, Low severity',
            'severity': 2
        },
        {
            'name': 'Severity: Very Low',
            'color': '0057e7',
            'description': 'A Veracode Flaw, Very Low severity',
            'severity': 1
        },
        {
            'name': 'Severity: Informational',
            'color': '00b159',
            'description': 'A Veracode Flaw, Informational severity',
            'severity': 0
        }
    ],
    'veracode' : {
        'name': 'Veracode',
        'color': '00b2e5',
        'description': 'A Veracode identified issue'
    }
};

const getVeracodeLabel = async (owner,repo) => {
    console.log('getVeracodeLabel - START');
    let veracodeLabel = {};
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        veracodeLabel = await appOctokit
            .issues.getLabel({
                owner,
                repo,
                name:LABELS.veracode.name
        });
        console.log('Veracode Labels already exist');
    } catch (e) {
        if (e.status===404) {
            console.log('Veracode Labels does not exist');
        } else {
            console.log('=======================   ERROR   ===============================');
            console.log(e);
        }
    }
    console.log('getVeracodeLabel - END');
    return veracodeLabel;
};

const createVeracodeLabels = async (owner,repo) => {
    console.log('createVeracodeLabels - END');
    try {
        const appOctokit = await githubAPIHandler.getAuthApp();
        // Creating the severity labels
        for (const lebelAttr of LABELS.severities) {
            await appOctokit.issues.createLabel({
                owner,
                repo,
                name: lebelAttr.name,
                color: lebelAttr.color,
                description: lebelAttr.description
            });
        }
        // Creating the base label
        await appOctokit.issues.createLabel({
            owner,
            repo,
            name: LABELS.veracode.name,
            color: LABELS.veracode.color,
            description: LABELS.veracode.description
        });

    } catch (e) {
        console.log('=======================   ERROR   ===============================');
        console.log(e);
    }
    console.log('createVeracodeLabels - END');
}

module.exports = {
    createVeracodeLabels,
    getVeracodeLabel,
    LABELS
}