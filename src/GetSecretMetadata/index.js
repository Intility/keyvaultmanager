const { mapOpenApi3 } = require('@aaronpowell/azure-functions-nodejs-openapi');
const common = require('../Common/common');
const secreter = require('../Common/secret');
const table = require('../Common/table');

const utils = new common();
const secretClient = new secreter();
const tableClient = new table();

const httpTrigger = async function (context, req) {
  const principalObect = req.headers['x-ms-client-principal'];
  try {
    utils.authorize(principalObect, 'Reader');
  } catch (error) {
    await utils.captureException(error);
    /* istanbul ignore else */
    if (!error.status) {
      context.log.error(
        `InvocationId: ${context.invocationId}, Authorization error: ${error}`
      );
    }
    return (context.res = {
      status: error.message || 500,
    });
  }

  try {
    // get secret
    const secret = await secretClient.getSecret(req.params.name);

    // get secret metadata entity
    const partitionKey = 'secret';
    const vaultUrl = secret.properties.vaultUrl + '/secrets/' + secret.name;
    const rowKey = vaultUrl.replace(/\//g, '_');
    const secretEntity = await tableClient.getEntity(partitionKey, rowKey);
    const metadata = { ...secretEntity };
    delete metadata['odata.metadata'];
    delete metadata['etag'];
    delete metadata['partitionKey'];
    delete metadata['rowKey'];
    delete metadata['timestamp'];

    return (context.res = {
      status: 200,
      body: metadata,
    });
  } catch (error) {
    await utils.captureException(error);
    return utils.errorResponse(context, req, error);
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, '/secrets/{name}/metadata', {
    get: {
      tags: ['secrets'],
      summary: 'Get secret metadata',
      description: '',
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'Secret name',
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        200: {
          description: 'Returns a secret',
          content: {
            'application/json': {
              example: {
                consumer1: 'https://secret.used.here',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
        },
        403: {
          description: 'Access denied, missing required role',
          content: {
            'text/plain': {
              examples:
                'Access denied, key vault manager does not have access to the key vault.',
            },
          },
        },
        404: {
          description: 'Secret not found',
          content: {
            'text/plain': {
              example: `Secret {name} was not found.`,
            },
          },
        },
        500: {
          description: 'Internal server error',
        },
      },
    },
  }),
};
