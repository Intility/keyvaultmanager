/* istanbul ignore file */
const {
  generateOpenApi3Spec,
} = require('@aaronpowell/azure-functions-nodejs-openapi');

module.exports = generateOpenApi3Spec({
  info: {
    title: 'Key vault manager api',
    version: '0.0.1',
  },
});
