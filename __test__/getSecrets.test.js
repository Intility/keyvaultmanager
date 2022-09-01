const { httpTrigger } = require('../src/GetSecrets/index');
const common = require('../src/Common/common');
const secreter = require('../src/Common/secret');

jest.mock('../src/Common/common');
jest.mock('../src/Common/secret');

describe('getSecret', () => {
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
  let secretsArr = [
    {
      name: 'secretName',
      properties: {
        vaultUrl: 'https://name.vault.azure.net',
      },
    },
    {
      name: 'secretName2',
      properties: {
        vaultUrl: 'https://name.vault.azure.net',
      },
    },
  ];
  const mockContextObj = contextObj;
  const mockReqObj = reqObj;
  const mockErrorObj = errorObj;
  const mockSecretObj = secretObj;
  const mockSecretsArr = secretsArr;
  beforeEach(() => {
    contextObj = { ...mockContextObj };
    reqObj = { ...mockReqObj };
    errorObj = { ...mockErrorObj };
    secretObj = { ...mockSecretObj };
    secretsArr = { ...mockSecretsArr };
  });
  afterEach(() => {
    contextObj = mockContextObj;
    reqObj = mockReqObj;
    errorObj = mockErrorObj;
    secretObj = mockSecretObj;
    secretsArr = mockSecretsArr;
  });
  it('should return all secrets', async () => {
    const authorizeSpy = jest
      .spyOn(common.prototype, 'authorize')
      .mockResolvedValueOnce(true);
    const getSecretsSpy = jest
      .spyOn(secreter.prototype, 'getSecrets')
      .mockResolvedValueOnce(secretsArr);
    await httpTrigger(contextObj, reqObj);
    expect(authorizeSpy).toHaveBeenCalledWith(
      reqObj.headers['x-ms-client-principal'],
      'Reader'
    );
    expect(getSecretsSpy).toHaveBeenCalledWith();
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
      'Reader'
    );
    expect(authorizeSpy).toThrow(authError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(authError);
    authorizeSpy.mockReset();
  });
  it('should handle error if get secrets fails', async () => {
    const secretError = new Error('Fake internal server error');
    const getSecretsSpy = jest
      .spyOn(secreter.prototype, 'getSecrets')
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
    expect(getSecretsSpy).toThrow(secretError);
    expect(captureExceptionSpy).toHaveBeenCalledWith(secretError);
    expect(errorResponseSpy).toHaveBeenCalledWith(
      contextObj,
      reqObj,
      secretError
    );
    getSecretsSpy.mockReset();
  });
});
