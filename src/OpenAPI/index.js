/* istanbul ignore file */
const {
  generateOpenApi3Spec,
} = require('@aaronpowell/azure-functions-nodejs-openapi');
const { name, version } = require('../package.json');

module.exports = generateOpenApi3Spec({
  info: {
    title: name,
    version: version,
  },
});
