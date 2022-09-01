const { httpTrigger } = require('../src/PostSecret/index');
const common = require('../src/Common/common');
const secreter = require('../src/Common/secret');
const validator = require('../src/Common/validate');
const table = require('../src/Common/table');

jest.mock('../src/Common/common');
jest.mock('../src/Common/secret');
jest.mock('../src/Common/validate');
jest.mock('../src/Common/table');

describe('postSecret', () => {
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
  let reqObj = {
    params: {
      name: 'secretName',
    },
    body: {
      name: 'secretName',
      value: 'secretValue',
      enabled: true,
      contentType: 'test',
      notBefore: now.toISOString(),
      expiresOn: later.toISOString(),
      tags: {
        managed: true,
        autoRotate: false,
        owner: 'https://this.is.the.owner',
      },
      metadata: {
        consumer1: 'https://this.is.consumer.one',
        consumer2: 'https://this.is.consumer.two',
      },
    },
    headers: {
      'x-ms-client-principal': 'string',
    },
    url: 'https://name.azurewebsites.net/api/secrets/',
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
    value: 'secretValue',
    name: 'secretName',
    properties: {
      expiresOn: later,
      createdOn: now,
      updatedOn: now,
      enabled: true,
      notBefore: now,
      recoverableDays: 90,
      recoveryLevel: 'Recoerable',
      id: 'https://name.vault.azure.net/secrets/test/123abc',
      contentType: 'test',
      tags: {
        managed: 'true',
        autoRotate: 'false',
        owner: 'https://this.is.the.owner',
        metadataUrl: 'https://this.is.the.metadata',
      },
      managed: undefined,
      vaultUrl: 'https://name.vault.azure.net',
      version: '123abc',
      name: 'test',
      certificateKeyId: undefined,
    },
  };
  let optionsObj = {
    enabled: true,
    contentType: 'test',
    notBefore: now.toISOString(),
    expiresOn: later.toISOString(),
    tags: {
      managed: 'true',
      autoRotate: 'false',
      owner: 'https://this.is.the.owner',
      metadataUrl:
        'https://name.azurewebsites.net/api/secrets/secretName/metadata',
    },
  };
  let entityObj = {
    partitionKey: 'secret',
    rowKey: 'https:__name.vault.azure.net_secrets_secretName',
    consumer1: 'https://this.is.consumer.one',
  };
  let metadataObj = {
    consumer1: 'https://this.is.consumer.one',
    consumer2: 'https://this.is.consumer.two',
  };
  const mockContextObj = contextObj;
  const mockReqObj = reqObj;
  const mockErrorObj = errorObj;
  const mockSecretObj = secretObj;
  const mockOptionsObj = optionsObj;
  const mockEntityObj = entityObj;
  const mockMetadataObj = metadataObj;
  beforeEach(() => {
    contextObj = { ...mockContextObj };
    reqObj = { ...mockReqObj };
    errorObj = { ...mockErrorObj };
    secretObj = { ...mockSecretObj };
    optionsObj = { ...mockOptionsObj };
    entityObj = { ...mockEntityObj };
    metadataObj = { ...mockMetadataObj };
  });
  afterEach(() => {
    contextObj = mockContextObj;
    reqObj = mockReqObj;
    errorObj = mockErrorObj;
    secretObj = mockSecretObj;
    optionsObj = mockOptionsObj;
    entityObj = mockEntityObj;
    metadataObj = mockMetadataObj;
  });
  it('should create a secret', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockRejectedValueOnce({ statusCode: 404 });
    const validateSpy = jest
      .spyOn(validator.prototype, 'createSecret')
      .mockResolvedValueOnce(true);
    const createSecretSpy = jest
      .spyOn(secreter.prototype, 'createSecret')
      .mockResolvedValueOnce(secretObj);
    const createEntitySpy = jest
      .spyOn(table.prototype, 'createEntity')
      .mockResolvedValueOnce(entityObj);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalledWith(
      reqObj.headers['x-ms-client-principal'],
      'Writer'
    );
    expect(getSecretSpy).toHaveBeenCalledWith(reqObj.body.name);
    expect(validateSpy).toHaveBeenCalledWith(reqObj.body);
    expect(createSecretSpy).toHaveBeenCalledWith(
      reqObj.body.name,
      reqObj.body.value,
      optionsObj
    );
    expect(createEntitySpy).toHaveBeenCalledWith(
      entityObj.partitionKey,
      entityObj.rowKey,
      reqObj.body.metadata
    );
  });
  it('should error if auth fails', async () => {
    const authError = new Error('401');
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockImplementation(() => {
        throw authError;
      });
    const captureExceptionSpy = jest
      .spyOn(common.prototype, 'captureException')
      .mockResolvedValueOnce(true);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalledWith(
      reqObj.headers['x-ms-client-principal'],
      'Writer'
    );
    expect(authorizeSpy).toThrow(authError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(authError);
    authorizeSpy.mockReset();
  });
  it('should return 409 conflict if secret already exists', async () => {
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    await httpTrigger(contextObj, reqObj);
    expect(getSecretSpy).toHaveBeenCalledWith(reqObj.body.name);
  });
  it('should handle error if get secret fails', async () => {
    const secretError = new Error('Fake internal server error');
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockImplementation(() => {
        throw secretError;
      });
    const captureExceptionSpy = jest
      .spyOn(common.prototype, 'captureException')
      .mockResolvedValueOnce(true);
    const errorResponseSpy = jest
      .spyOn(common.prototype, 'errorResponse')
      .mockReturnValueOnce(true);
    await httpTrigger(contextObj, reqObj);
    expect(getSecretSpy).toThrow(secretError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(secretError);
    expect(errorResponseSpy).toHaveBeenCalledWith(
      contextObj,
      reqObj,
      secretError
    );
    getSecretSpy.mockReset();
  });
  it('should return error if validation fails', async () => {
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockRejectedValueOnce({ statusCode: 404 });
    const validateSpy = jest
      .spyOn(validator.prototype, 'createSecret')
      .mockResolvedValueOnce({ error: expect.any(Object) });
    await httpTrigger(contextObj, reqObj);
    expect(getSecretSpy).toHaveBeenCalledWith(reqObj.body.name);
    expect(validateSpy).toHaveBeenCalledWith(reqObj.body);
  });
  it('should handle error if createSecret fails', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockRejectedValueOnce({ statusCode: 404 });
    const validateSpy = jest
      .spyOn(validator.prototype, 'createSecret')
      .mockResolvedValueOnce(true);
    const createSecretSpy = jest
      .spyOn(secreter.prototype, 'createSecret')
      .mockImplementation(() => {
        throw errorObj;
      });
    const captureExceptionSpy = jest
      .spyOn(common.prototype, 'captureException')
      .mockResolvedValueOnce(true);
    const errorResponseSpy = jest
      .spyOn(common.prototype, 'errorResponse')
      .mockReturnValueOnce(true);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalled();
    expect(getSecretSpy).toHaveBeenCalled();
    expect(validateSpy).toHaveBeenCalled();
    expect(createSecretSpy).toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledWith(errorObj);
    expect(errorResponseSpy).toHaveBeenCalledWith(contextObj, reqObj, errorObj);
    createSecretSpy.mockReset();
  });
});
