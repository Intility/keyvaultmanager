const eventAutomation = require('../src/EventAutomation/index');
const secreter = require('../src/Common/secret');
const alerter = require('../src/Common/alert');
const validator = require('../src/Common/validate');
const common = require('../src/Common/common');

jest.mock('../src/Common/secret');
jest.mock('../src/Common/alert');
jest.mock('../src/Common/validate');
jest.mock('../src/Common/common');

describe('Event Automation', () => {
  let now = new Date();
  let later = new Date(now.setMonth(now.getMonth() + 1));
  let contextObj = {
    invocationId: '123abc',
    res: {
      status: 1,
      body: 'message',
    },
    log: {
      error: jest.fn(),
    },
  };
  let eventObj = {
    id: '123abc',
    topic:
      '/subscriptions/123abc/resourceGroups/name/providers/Microsoft.KeyVault/vaults/name',
    subject: 'test',
    eventType: 'Microsoft.KeyVault.SecretNewVersionCreated',
    data: {
      Id: 'https://name.vault.azure.net/secrets/test/123abc',
      VaultName: 'name',
      ObjectType: 'Secret',
      ObjectName: 'test',
      Version: '123abc',
      NBF: now,
      EXP: later,
    },
    dataVersion: '1',
    metadataVersion: '1',
    eventTime: now.toISOString(),
  };

  let reqObj = {
    params: {
      name: 'secretName',
    },
    body: {
      name: 'secretName',
    },
    headers: {
      'x-ms-client-principal': 'string',
    },
  };
  let headersMap = new Map();
  headersMap.set('user-agent', 'azsdk-js-...');
  let errorObj = {
    request: {
      headers: headersMap,
    },
    statusCode: 1,
    message: 'error message',
  };
  let secretObj = {
    name: 'secretName',
    properties: {
      name: 'secretName',
      enabled: true,
      notBefore: now,
      expiresOn: later,
      vaultUrl: 'https://name.vault.azure.net',
      id: 'https://name.vault.azure.net/secrets/test/123abc',
      tags: {
        managed: 'true',
      },
    },
  };
  let entityObj = {
    partitionKey: 'secret',
    RowKey: 'https:__name.vault.azure.net_secrets_secretName',
    consumer1: 'https://this.is.consumer.one',
  };
  const mockContextObj = contextObj;
  const mockEventObj = eventObj;
  const mockReqObj = reqObj;
  const mockErrorObj = errorObj;
  const mockSecretObj = secretObj;
  const mockEntityObj = entityObj;
  beforeEach(() => {
    contextObj = { ...mockContextObj };
    eventObj = { ...mockEventObj };
    reqObj = { ...mockReqObj };
    errorObj = { ...mockErrorObj };
    secretObj = { ...mockSecretObj };
    entityObj = { ...mockEntityObj };
  });
  afterEach(() => {
    contextObj = mockContextObj;
    eventObj = mockEventObj;
    reqObj = mockReqObj;
    errorObj = mockErrorObj;
    secretObj = mockSecretObj;
    entityObj = mockEntityObj;
  });
  it('should handle event SecretNewVersionCreated', async () => {
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const validateSpy = jest
      .spyOn(validator.prototype, 'keyVaultSecret')
      .mockResolvedValueOnce({ error: { message: 'this is the error' } });
    const alertSpy = jest
      .spyOn(alerter.prototype, 'send')
      .mockResolvedValueOnce(true);
    await eventAutomation(contextObj, eventObj);
    expect(getSecretSpy).toHaveBeenCalledWith(eventObj.data.ObjectName);
    expect(validateSpy).toHaveBeenCalledWith(secretObj);
    expect(alertSpy).toHaveBeenCalledWith(
      eventObj.data.VaultName,
      secretObj.name,
      `New secret failed validation: this is the error`,
      `Add or update specified properties`,
      secretObj.properties.id
    );
  });
  it('should handle event SecretNearExpiry', async () => {
    eventObj.eventType = 'Microsoft.KeyVault.SecretNearExpiry';
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const alertSpy = jest
      .spyOn(alerter.prototype, 'send')
      .mockResolvedValueOnce(true);
    await eventAutomation(contextObj, eventObj);
    expect(getSecretSpy).toHaveBeenCalledWith(eventObj.data.ObjectName);
    expect(alertSpy).toHaveBeenCalledWith(
      eventObj.data.VaultName,
      secretObj.name,
      `Secret expires: ${secretObj.properties.expiresOn}`,
      `Rotate secret before it expires! Rotate, add new verstion to key vault and "load" new version wherever its used.`,
      secretObj.properties.id
    );
  });
  it('should handle event SecretExpired', async () => {
    eventObj.eventType = 'Microsoft.KeyVault.SecretExpired';
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const alertSpy = jest
      .spyOn(alerter.prototype, 'send')
      .mockResolvedValueOnce(true);
    await eventAutomation(contextObj, eventObj);
    expect(getSecretSpy).toHaveBeenCalledWith(eventObj.data.ObjectName);
    expect(alertSpy).toHaveBeenCalledWith(
      eventObj.data.VaultName,
      secretObj.name,
      `Secret has expired: ${secretObj.properties.expiresOn} (UTC)`,
      `Rotate secret immediately if its still in use! Rotate, add new verstion to key vault and "load" new version wherever its used. Disable or remove if secret is no longer in use.`,
      secretObj.properties.id
    );
  });
  it('should handle error if getSecret fails', async () => {
    const secretError = new Error('Fake internal server error');
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockImplementation(() => {
        throw secretError;
      });
    const captureExceptionSpy = jest
      .spyOn(common.prototype, 'captureException')
      .mockResolvedValueOnce(true);
    await eventAutomation(contextObj, eventObj);
    expect(getSecretSpy).toThrow(secretError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(secretError);
    getSecretSpy.mockReset();
  });
});
