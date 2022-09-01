const { httpTrigger } = require('../src/DeleteSecret/index');
const common = require('../src/Common/common');
const secreter = require('../src/Common/secret');
const table = require('../src/Common/table');

jest.mock('../src/Common/common');
jest.mock('../src/Common/secret');
jest.mock('../src/Common/table');

describe('deleteSecret', () => {
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
      vaultUrl: 'https://name.vault.azure.net',
    },
  };
  let entityObj = {
    partitionKey: 'secret',
    RowKey: 'https:__name.vault.azure.net_secrets_secretName',
    consumer1: 'https://this.is.consumer.one',
  };
  const mockContextObj = contextObj;
  const mockReqObj = reqObj;
  const mockErrorObj = errorObj;
  const mockSecretObj = secretObj;
  const mockEntityObj = entityObj;
  beforeEach(() => {
    contextObj = { ...mockContextObj };
    reqObj = { ...mockReqObj };
    errorObj = { ...mockErrorObj };
    secretObj = { ...mockSecretObj };
    entityObj = { ...mockEntityObj };
  });
  afterEach(() => {
    contextObj = mockContextObj;
    reqObj = mockReqObj;
    errorObj = mockErrorObj;
    secretObj = mockSecretObj;
    entityObj = mockEntityObj;
  });
  it('should delete a secret', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const deleteSecretSpy = jest
      .spyOn(secreter.prototype, 'deleteSecret')
      .mockResolvedValueOnce(secretObj);
    const deleteEntitySpy = jest
      .spyOn(table.prototype, 'deleteEntity')
      .mockResolvedValueOnce(entityObj);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalledWith(
      reqObj.headers['x-ms-client-principal'],
      'Writer'
    );
    expect(deleteSecretSpy).toHaveBeenCalledWith(reqObj.params.name);
    expect(deleteEntitySpy).toHaveBeenCalledWith(
      entityObj.partitionKey,
      entityObj.RowKey
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
  it('should handle error if get secret or get entity fails', async () => {
    const secretError = new Error('Fake internal server error');
    const deleteSecretSpy = jest
      .spyOn(secreter.prototype, 'deleteSecret')
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
    expect(deleteSecretSpy).toThrow(secretError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(secretError);
    expect(errorResponseSpy).toHaveBeenCalledWith(
      contextObj,
      reqObj,
      secretError
    );
    deleteSecretSpy.mockReset();
  });
});
