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
    // get secret metadata
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

    secret.metadata = metadata;

    return (context.res = {
      status: 200,
      body: secret,
    });
  } catch (error) {
    await utils.captureException(error);
    if (
      error.request.headers
        .get('user-agent')
        .includes('azsdk-js-keyvault-secrets')
    ) {
      if (error.statusCode === 403) {
        return (context.res = {
          status: 403,
          body: `Access denied, key vault manager does not have access to the key vault.`,
        });
      }
      if (error.statusCode === 404) {
        return (context.res = {
          status: 404,
          body: `Secret "${req.params.name}" was not found.`,
        });
      }
    }

    if (
      error.request.headers.get('user-agent').includes('azsdk-js-data-tables')
    ) {
      if (error.statusCode === 403) {
        return (context.res = {
          status: 403,
          body: `Access denied, key vault manager does not have access to the table storage.`,
        });
      }
      if (error.statusCode === 404) {
        return (context.res = {
          status: 404,
          body: `Metadata for secret "${req.params.name}" was not found.`,
        });
      }
    }

    context.log.error(
      `InvocationId: ${context.invocationId}, Error: ${error.message}`
    );
    return (context.res = {
      status: 500,
    });
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, '/secrets/{name}', {
    get: {
      tags: ['secrets'],
      summary: 'Get secret from key vault',
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
          description: 'Returns secret',
          content: {
            'application/json': {
              example: {
                value: 'topSecret123!',
                name: 'ThisIsTheSecret',
                properties: {
                  expiresOn: '2022-02-01T12:00:00.000Z',
                  createdOn: '2022-01-01T12:00:00.000Z',
                  updatedOn: '2022-02-02T12:00:00.000Z',
                  enabled: true,
                  notBefore: '2022-01-01T12:00:00.000Z',
                  recoverableDays: 90,
                  recoveryLevel: 'Recoverable',
                  id: 'https://keyvaultname.vault.azure.net/secrets/ThisIsTheSecret/44afcd5415474a0e9ff13878c3c16fb8',
                  contentType: 'test',
                  tags: {
                    managed: 'true',
                    autoRotate: 'false',
                    ownerUri: 'https://secret.owned.here',
                    metadataUrl:
                      'https://func-kvmgmt-{id}.azurewebsites.net/api/secret/thisisthesecret/metadata',
                  },
                  vaultUrl: 'https://keyvaultname.vault.azure.net',
                  version: '44afcd5415474a0e9ff13878c3c16fb8',
                  name: 'ThisIsTheSecret',
                },
                metadata: {
                  consumer1: 'https://secret.used.here',
                },
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
              example: 'Access denied, missing required role.',
            },
          },
        },
        404: {
          description: 'Secret not found',
          content: {
            'text/plain': {
              example: `Secret "secretname" was not found.`,
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
