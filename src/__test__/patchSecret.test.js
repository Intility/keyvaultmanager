const { httpTrigger } = require('../PatchSecret/index');
const common = require('../Common/common');
const secreter = require('../Common/secret');
const validator = require('../Common/validate');
const table = require('../Common/table');

jest.mock('../Common/common');
jest.mock('../Common/secret');
jest.mock('../Common/validate');
jest.mock('../Common/table');

describe('patchSecret', () => {
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
    url: 'https://name.azurewebsites.net/api/secrets/secretName',
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
  let now = new Date();
  let later = new Date(now.setMonth(now.getMonth() + 1));
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
        managed: true,
        autoRotate: false,
        owner: 'https://this.is.the.owner',
        metadataUrl:
          'https://name.azurewebsites.net/api/secrets/secretName/metadata',
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
      managed: true,
      autoRotate: false,
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
  it('should update a secret', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const validateSpy = jest
      .spyOn(validator.prototype, 'updateSecret')
      .mockResolvedValueOnce(true);
    const convertTagsSpy = jest
      .spyOn(common.prototype, 'convertTags')
      .mockResolvedValueOnce(true);
    const updateSecretSpy = jest
      .spyOn(secreter.prototype, 'updateSecret')
      .mockResolvedValueOnce(secretObj);
    const getEntitySpy = jest
      .spyOn(table.prototype, 'getEntity')
      .mockResolvedValueOnce(entityObj);
    const updateEntitySpy = jest
      .spyOn(table.prototype, 'updateEntity')
      .mockResolvedValueOnce(entityObj);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalledWith(
      reqObj.headers['x-ms-client-principal'],
      'Writer'
    );
    expect(getSecretSpy).toHaveBeenCalledWith(reqObj.params.name);
    expect(validateSpy).toHaveBeenCalledWith(reqObj.body);
    expect(convertTagsSpy).toHaveBeenCalledWith(secretObj.properties.tags);
    expect(updateSecretSpy).toHaveBeenCalledWith(
      reqObj.params.name,
      secretObj.properties.version,
      optionsObj
    );
    expect(getEntitySpy).toHaveBeenCalledWith(
      entityObj.partitionKey,
      entityObj.rowKey
    );
    expect(updateEntitySpy).toHaveBeenCalledWith(
      entityObj.partitionKey,
      entityObj.rowKey,
      metadataObj,
      'Replace'
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
    const validateSpy = jest
      .spyOn(validator.prototype, 'updateSecret')
      .mockResolvedValueOnce({ error: expect.any(Object) });
    await httpTrigger(contextObj, reqObj);
    expect(validateSpy).toHaveBeenCalledWith(reqObj.body);
  });
  it('should create metadata if it doesnt exist', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const validateSpy = jest
      .spyOn(validator.prototype, 'updateSecret')
      .mockResolvedValueOnce(true);
    const convertTagsSpy = jest
      .spyOn(common.prototype, 'convertTags')
      .mockResolvedValueOnce(true);
    const updateSecretSpy = jest
      .spyOn(secreter.prototype, 'updateSecret')
      .mockResolvedValueOnce(secretObj);
    errorObj.request.headers.set('user-agent', 'azsdk-js-data-tables');
    errorObj.statusCode = 404;
    const updateEntitySpy = jest
      .spyOn(table.prototype, 'updateEntity')
      .mockImplementation(() => {
        throw errorObj;
      });
    const upsertEntitySpy = jest
      .spyOn(table.prototype, 'upsertEntity')
      .mockResolvedValueOnce(entityObj);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalled();
    expect(getSecretSpy).toHaveBeenCalled();
    expect(validateSpy).toHaveBeenCalled();
    expect(convertTagsSpy).toHaveBeenCalled();
    expect(updateSecretSpy).toHaveBeenCalled();
    expect(updateEntitySpy).toThrow(errorObj);
    expect(upsertEntitySpy).toHaveBeenCalledWith(
      entityObj.partitionKey,
      entityObj.rowKey,
      reqObj.body.metadata,
      'Replace'
    );
    updateEntitySpy.mockReset();
  });
  it('should handle error if updateSecret fails', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretSpy = jest
      .spyOn(secreter.prototype, 'getSecret')
      .mockResolvedValueOnce(secretObj);
    const validateSpy = jest
      .spyOn(validator.prototype, 'updateSecret')
      .mockResolvedValueOnce(true);
    const convertTagsSpy = jest
      .spyOn(common.prototype, 'convertTags')
      .mockResolvedValueOnce(true);
    const updateSecretSpy = jest
      .spyOn(secreter.prototype, 'updateSecret')
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
    expect(convertTagsSpy).toHaveBeenCalled();
    expect(updateSecretSpy).toHaveBeenCalled();
    expect(captureExceptionSpy).toHaveBeenCalledWith(errorObj);
    expect(errorResponseSpy).toHaveBeenCalledWith(contextObj, reqObj, errorObj);
    updateSecretSpy.mockReset();
  });
});
