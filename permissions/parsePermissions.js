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
        newResource = statement.Resource.map((resourceElement) => {
            return replaceResource(resourceElement);
        })
    }

    return {
        Action: statement.Action,
        Effect: statement.Effect,
        Resource: newResource
    }
});

const policy = {
    "Version": "2012-10-17",
    "Statement": replaced
};

fs.writeFileSync('./policy.json',JSON.stringify(policy, null, 2));
