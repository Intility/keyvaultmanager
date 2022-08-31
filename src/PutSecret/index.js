const { mapOpenApi3 } = require('@aaronpowell/azure-functions-nodejs-openapi');
const common = require('../Common/common');
const secreter = require('../Common/secret');
const validator = require('../Common/validate');
const table = require('../Common/table');

const utils = new common();
const secretClient = new secreter();
const validate = new validator();
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
      status: error.message || 500,
    });
  }

  let existingSecret;
  try {
    // get existing secret
    existingSecret = await secretClient.getSecret(req.params.name);
  } catch (error) {
    await utils.captureException(error);
    return utils.errorResponse(context, req, error);
  }

  // validate the secret options
  const validation = await validate.createSecretVersion(req.body);
  if (validation.error) {
    return (context.res = {
      status: 422,
      body: `Schema validation failed: ${validation.error.message}`,
    });
  }

  // existing secret options object
  const { enabled, contentType, tags } = existingSecret.properties;
  const existingSecretOptions = {
    enabled,
    contentType,
    tags: {
      ...tags,
      managed: tags.managed,
      autoRotate: tags.autoRotate,
      owner: tags.owner,
      metadataUrl: tags.metadataUrl,
    },
  };

  // updated secret options object
  const newSecretOptions = { ...req.body };
  delete newSecretOptions.value;
  delete newSecretOptions.metadata;
  const updatedSecretOptions = {
    ...existingSecretOptions,
    ...newSecretOptions,
  };
  if (!updatedSecretOptions.tags.metadataUrl) {
    updatedSecretOptions.tags.metadataUrl = req.url + '/metadata';
  }

  utils.convertTags(updatedSecretOptions.tags);

  let secret;
  let partitionKey;
  let rowKey;

  try {
    // create secret version
    secret = await secretClient.createSecret(
      req.params.name,
      req.body.value,
      updatedSecretOptions
    );

    // get existing secret metadata
    partitionKey = 'secret';
    const vaultUrl =
      existingSecret.properties.vaultUrl + '/secrets/' + existingSecret.name;
    rowKey = vaultUrl.replace(/\//g, '_');
    const metadata = await tableClient.getEntity(partitionKey, rowKey);
    const existingMetadata = { ...metadata };
    delete existingMetadata['odata.metadata'];
    delete existingMetadata['etag'];
    delete existingMetadata['partitionKey'];
    delete existingMetadata['rowKey'];
    delete existingMetadata['timestamp'];

    // updated metadata object
    const newMetadata = { ...req.body.metadata };
    const mergedMetadata = {
      ...existingMetadata,
      ...newMetadata,
    };

    const updatedMetadataEntries = Object.entries(mergedMetadata).filter(
      ([_key, value]) => {
        const nullValues = [null, undefined, ''];
        return !nullValues.includes(value);
      }
    );
    const updatedMetadata = Object.fromEntries(updatedMetadataEntries);

    // update secret metadata
    await tableClient.updateEntity(
      partitionKey,
      rowKey,
      updatedMetadata,
      'Replace'
    );

    secret.metadata = updatedMetadata;

    return (context.res = {
      status: 200,
      body: secret,
    });
  } catch (error) {
    if (
      error.request.headers
        .get('user-agent')
        .includes('azsdk-js-data-tables') &&
      error.statusCode === 404
    ) {
      // create metadata if not exist
      await tableClient.upsertEntity(
        partitionKey,
        rowKey,
        req.body.metadata,
        'Replace'
      );
      secret.metadata = req.body.metadata;

      return (context.res = {
        status: 200,
        body: secret,
      });
    }
    await utils.captureException(error);
    return utils.errorResponse(context, req, error);
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, '/secrets/{name}', {
    put: {
      tags: ['secrets'],
      summary: 'Add new secret version and update tags/metadata in key vault',
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
      requestBody: {
        description: 'The new secret value and any updated tags/metadata',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                value: {
                  description: 'New secret value',
                  type: 'string',
                },
                enabled: {
                  description: 'Secret state',
                  type: 'boolean',
                },
                contentType: {
                  description: 'Secret content type',
                  type: 'string',
                },
                notBefore: {
                  description: 'Secret valid from',
                  type: 'string',
                },
                expiresOn: {
                  description: 'Secret valid to',
                  type: 'string',
                },
                tags: {
                  description: 'Secret tags',
                  type: 'object',
                  properties: {
                    managed: {
                      description: 'If secret is managed',
                      type: 'boolean',
                    },
                    autoRotate: {
                      description: 'If secret is auto rotated',
                      type: 'boolean',
                    },
                    owner: {
                      description: 'Secret owner resource URI',
                      type: 'string',
                    },
                  },
                },
                metadata: {
                  description: 'Secret tags',
                  type: 'object',
                  properties: {
                    consumer1: {
                      description: 'Uri for consumer 1 of the secret',
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Returns new secret version',
          content: {
            'application/json': {
              example: {
                value: 'realyTopSecret123!',
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
                  metadata: {
                    consumer1: 'https://secret.used.here',
                  },
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
        422: {
          description: 'Validation error',
          content: {
            'text/plain': {
              example: `Schema validation failed: "property name" must be a "type".`,
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
