const fs = require('fs');

const replaceResource = (resource) => {
    if (typeof(resource)==='string') {
        return resource
            .replace(/<AWSRegion>/g,process.env.AWS_Region)
            .replace('<Account_ID>',process.env.AWS_Account_ID)
            .replace('<Service>','github-status-check')
            .replace('<Stage>',process.env.Stage)
    } else {
        return resource;
    }
}

const template = fs.readFileSync('./permissions/base.json');
let jsonTemplate = JSON.parse(template);

const replaced = jsonTemplate.Statement.map((statement) => {
    const resource = statement.Resource;
    let newResource = '';
    if (typeof(resource)==='string') { 
        newResource = replaceResource(statement.Resource); 
    } else {
        newResource = statement.Resource.map((resource) => {
            return replaceResource(resource);
        })
    }

    return {
        Action: statement.Action,
        Effect: statement.Effect,
        Resource: newResource
    }
});

fs.writeFileSync('./permissions/policy.json',JSON.stringify(replaced, null, 2));
