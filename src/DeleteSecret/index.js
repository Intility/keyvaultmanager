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
    utils.authorize(principalObect, 'Writer');
  } catch (error) {
    await utils.captureException(error);
    /* istanbul ignore else */
    if (!error.status) {
      context.log.error(
        `InvocationId: ${context.invocationId}, Authorization error: ${error}`
      );
    }
    return (context.res = {
      status: error.status || 500,
    });
  }

  try {
    // delete secret
    const secret = await secretClient.deleteSecret(req.params.name);
    // delete secret metadata entity
    const partitionKey = 'secret';
    const vaultUrl = secret.properties.vaultUrl + '/secrets/' + secret.name;
    const rowKey = vaultUrl.replace(/\//g, '_');
    await tableClient.deleteEntity(partitionKey, rowKey);

    return (context.res = {
      status: 200,
      body: secret,
    });
  } catch (error) {
    await utils.captureException(error);
    return utils.errorResponse(context, req, error);
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, '/secrets/{name}', {
    delete: {
      tags: ['secrets'],
      summary: 'Delete secret from key vault',
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
          description: 'Returns deleted secret',
          content: {
            'application/json': {
              example: {
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
                  recoveryId:
                    'https://keyvaultname.vault.azure.net/deletedsecrets/ThisIsTheSecret',
                  scheduledPurgeDate: '2022-06-01T12:00:00.000Z',
                  deletedOn: '2022-03-03T12:00:00.000Z',
                },
                recoveryId:
                  'https://keyvaultname.vault.azure.net/deletedsecrets/ThisIsTheSecret',
                scheduledPurgeDate: '2022-06-01T12:00:00.000Z',
                deletedOn: '2022-03-03T12:00:00.000Z',
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
