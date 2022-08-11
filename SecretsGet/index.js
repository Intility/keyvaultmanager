const { mapOpenApi3 } = require('@aaronpowell/azure-functions-nodejs-openapi');
const common = require('../Common/common');
const secreter = require('../Common/secret');

const utils = new common();
const secretClient = new secreter();

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
    const secrets = await secretClient.getSecrets();
    return (context.res = {
      status: 200,
      body: secrets,
    });
  } catch (error) {
    await utils.captureException(error);
    await utils.errorResponse(context, req, error);
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, '/secrets', {
    get: {
      tags: ['secrets'],
      summary: 'Get all secrets in key vault',
      description: '',
      responses: {
        200: {
          description: 'Returns array of secrets',
          content: {
            'application/json': {
              example: [
                {
                  expiresOn: '2022-02-01T12:00:00.000Z',
                  createdOn: '2022-01-01T12:00:00.000Z',
                  updatedOn: '2022-02-02T12:00:00.000Z',
                  enabled: true,
                  notBefore: '2022-01-01T12:00:00.000Z',
                  recoverableDays: 90,
                  recoveryLevel: 'Recoverable',
                  id: 'https://keyvaultname.vault.azure.net/secrets/Secret1/44afcd5415474a0e9ff13878c3c16fb8',
                  contentType: 'test',
                  tags: {
                    managed: 'true',
                    autoRotate: 'false',
                    ownerUri: 'https://secret.owned.here',
                    metadataUrl:
                      'https://func-kvmgmt-{id}.azurewebsites.net/api/secret/thisisthesecret/metadata',
                  },
                  vaultUrl: 'https://keyvaultname.vault.azure.net',
                  name: 'Secret1',
                },
                {
                  expiresOn: '2022-02-01T12:00:00.000Z',
                  createdOn: '2022-01-01T12:00:00.000Z',
                  updatedOn: '2022-02-02T12:00:00.000Z',
                  enabled: true,
                  notBefore: '2022-01-01T12:00:00.000Z',
                  recoverableDays: 90,
                  recoveryLevel: 'Recoverable',
                  id: 'https://keyvaultname.vault.azure.net/secrets/Secret2/44afcd5415474a0e9ff13878c3c16fb8',
                  contentType: 'test',
                  tags: {
                    managed: 'true',
                    autoRotate: 'true',
                    ownerUri: 'https://secret.owned.here',
                    metadataUrl:
                      'https://func-kvmgmt-{id}.azurewebsites.net/api/secret/thisisthesecret/metadata',
                  },
                  vaultUrl: 'https://keyvaultname.vault.azure.net',
                  name: 'Secret2',
                },
                {
                  expiresOn: '2022-02-01T12:00:00.000Z',
                  createdOn: '2022-01-01T12:00:00.000Z',
                  updatedOn: '2022-02-02T12:00:00.000Z',
                  enabled: false,
                  notBefore: '2022-01-01T12:00:00.000Z',
                  recoverableDays: 90,
                  recoveryLevel: 'Recoverable',
                  id: 'https://keyvaultname.vault.azure.net/secrets/Secret3/44afcd5415474a0e9ff13878c3c16fb8',
                  contentType: 'test',
                  tags: {
                    managed: 'false',
                    autoRotate: 'false',
                    ownerUri: 'https://secret.owned.here',
                    metadataUrl:
                      'https://func-kvmgmt-{id}.azurewebsites.net/api/secret/thisisthesecret/metadata',
                  },
                  vaultUrl: 'https://keyvaultname.vault.azure.net',
                  name: 'Secret3',
                },
              ],
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
        500: {
          description: 'Internal server error',
        },
      },
    },
  }),
};
