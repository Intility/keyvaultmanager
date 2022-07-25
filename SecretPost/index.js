const { mapOpenApi3 } = require("@aaronpowell/azure-functions-nodejs-openapi");
const common = require("../Common/common");
const secreter = require("../Common/secret");
const validator = require("../Common/validate");
const table = require("../Common/table");

const utils = new common();
const secretClient = new secreter();
const validate = new validator();
const tableClient = new table();

const httpTrigger = async function (context, req) {
  const principalObect = req.headers["x-ms-client-principal"];
  try {
    utils.authorize(principalObect, "Writer");
  } catch (error) {
    await utils.captureException(error);
    if (!error.status) {
      context.log.error(
        `InvocationId: ${context.invocationId}, Authorization error: ${error}`
      );
    }
    return {
      status: error.message || 500,
    };
  }

  try {
    // get Secret
    const secret = await secretClient.getSecret(req.body.name);
    if (secret.name === req.body.name) {
      return {
        status: 409,
        body: `Secret "${req.body.name}" already exists.`,
      };
    }
  } catch (error) {
    await utils.captureException(error);
    if (error.statusCode !== 404) {
      if (error.statusCode === 403) {
        return {
          status: 403,
          body: `Access denied, key vault manager does not have access to the key vault.`,
        };
      }
      context.log.error(
        `InvocationId: ${context.invocationId}, Error: ${error.message}`
      );
      return {
        status: 500,
      };
    }
  }

  // validate the secret options
  const validation = await validate.createSecret(req.body);
  if (validation.error) {
    return {
      status: 422,
      body: `Schema validation failed: ${validation.error.message}`,
    };
  }

  // construct secret options object
  const metadataUrl = req.url + "/metadata";
  const { enabled, contentType, notBefore, expiresOn, tags } = req.body;
  const secretOptions = {
    enabled,
    contentType,
    notBefore,
    expiresOn,
    tags: {
      ...tags,
      managed: String(tags.managed),
      autoRotate: String(tags.autoRotate),
      owner: String(tags.owner),
      metadataUrl,
    },
  };

  try {
    // create secret
    const secret = await secretClient.createSecret(
      req.body.name,
      req.body.value,
      secretOptions
    );

    const partitionKey = "secret";
    const vaultUrl = secret.properties.vaultUrl + "/secrets/" + secret.name;
    const rowKey = vaultUrl.replace(/\//g, "_");
    await tableClient.createEntity(partitionKey, rowKey, req.body.metadata);

    secret.metadata = req.body.metadata;

    context.res = {
      status: 200,
      body: secret,
    };
  } catch (error) {
    await utils.captureException(error);
    if (
      error.request.headers
        .get("user-agent")
        .includes("azsdk-js-keyvault-secrets")
    ) {
      if (error.statusCode === 403) {
        return {
          status: 403,
          body: `Access denied, key vault manager does not have access to the key vault.`,
        };
      }
      if (
        error.message
          .toLowerCase()
          .includes(
            "is currently in a deleted but recoverable state, and its name cannot be reused"
          )
      ) {
        return {
          status: 409,
          body: `Secret "${req.body.name}" already exists. It is in a deleted state but can be recovered or purged.`,
        };
      }
    }

    if (
      error.request.headers.get("user-agent").includes("azsdk-js-data-tables")
    ) {
      if (error.statusCode === 403) {
        return {
          status: 403,
          body: `Access denied, key vault manager does not have access to the table storage.`,
        };
      }
    }

    context.log.error(
      `InvocationId: ${context.invocationId}, Error: ${error.message}`
    );
    context.res = {
      status: 500,
    };
  }
};

module.exports = {
  httpTrigger,
  run: mapOpenApi3(httpTrigger, "/secrets", {
    post: {
      tags: ["secrets"],
      summary: "Add secret to key vault",
      description: "",
      requestBody: {
        description: "The secret that you want to add",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "name",
                "value",
                "enabled",
                "contentType",
                "notBefore",
                "expiresOn",
                "managed",
                "autoRotate",
              ],
              properties: {
                name: {
                  description: "Secret name",
                  type: "string",
                },
                value: {
                  description: "Secret value",
                  type: "string",
                },
                enabled: {
                  description: "Secret state",
                  type: "boolean",
                },
                contentType: {
                  description: "Secret content type",
                  type: "string",
                },
                notBefore: {
                  description: "Secret valid from",
                  type: "string",
                },
                expiresOn: {
                  description: "Secret valid to",
                  type: "string",
                },
                tags: {
                  description: "Secret tags",
                  type: "object",
                  properties: {
                    managed: {
                      description: "If secret is managed",
                      type: "boolean",
                    },
                    autoRotate: {
                      description: "If secret is auto rotated",
                      type: "boolean",
                    },
                    owner: {
                      desription: "Secret owner resource URI",
                      type: "boolean",
                    },
                  },
                },
                metadata: {
                  description: "Secret tags",
                  type: "object",
                  properties: {
                    consumer1: {
                      description: "Uri for consumer 1 of the secret",
                      type: "string",
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
          description: "Returns added secret",
          content: {
            "application/json": {
              example: {
                value: "topSecret123!",
                name: "ThisIsTheSecret",
                properties: {
                  expiresOn: "2022-02-01T12:00:00.000Z",
                  createdOn: "2022-01-01T12:00:00.000Z",
                  updatedOn: "2022-02-02T12:00:00.000Z",
                  enabled: true,
                  notBefore: "2022-01-01T12:00:00.000Z",
                  recoverableDays: 90,
                  recoveryLevel: "Recoverable",
                  id: "https://keyvaultname.vault.azure.net/secrets/ThisIsTheSecret/44afcd5415474a0e9ff13878c3c16fb8",
                  contentType: "test",
                  tags: {
                    managed: "true",
                    autoRotate: "false",
                    ownerUri: "https://secret.owned.here",
                    metadataUrl:
                      "https://func-kvmgmt-{id}.azurewebsites.net/api/secret/thisisthesecret/metadata",
                  },
                  vaultUrl: "https://keyvaultname.vault.azure.net",
                  version: "44afcd5415474a0e9ff13878c3c16fb8",
                  name: "ThisIsTheSecret",
                  metadata: {
                    consumer1: "https://secret.used.here",
                  },
                },
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Access denied, missing required role",
          content: {
            "text/plain": {
              example: "Access denied, missing required role.",
            },
          },
        },
        409: {
          description: "Secret already exists",
          content: {
            "text/plain": {
              example: `Secret "secretname" already exists.`,
            },
          },
        },
        422: {
          description: "Validation error",
          content: {
            "text/plain": {
              example: `Schema validation failed: "property name" must be a "type".`,
            },
          },
        },
        500: {
          description: "Internal server error",
        },
      },
    },
  }),
};
