const scheduleAutomation = require('../ScheduleAutomation/index');
const common = require('../Common/common');
const secreter = require('../Common/secret');
const alerter = require('../Common/alert');
const validator = require('../Common/validate');

jest.mock('../Common/common');
jest.mock('../Common/secret');
jest.mock('../Common/alert');
jest.mock('../Common/validate');

describe('Schedule Automation', () => {
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
  let secretObj = {
    name: 'secretName',
    enabled: true,
    notBefore: now,
    expiresOn: later,
    vaultUrl: 'https://name.vault.azure.net',
    id: 'https://name.vault.azure.net/secrets/secretName/123abc',
    tags: {
      managed: 'true',
    },
  };
  let secret2Obj = {
    name: 'secretName2',
    enabled: true,
    notBefore: now,
    expiresOn: later,
    vaultUrl: 'https://name.vault.azure.net',
    id: 'https://name.vault.azure.net/secrets/secretName2/123abc',
    tags: {
      managed: 'true',
    },
  };
  const mockContextObj = contextObj;
  const mockSecretObj = secretObj;
  const mockSecret2Obj = secret2Obj;
  beforeEach(() => {
    contextObj = { ...mockContextObj };
    secretObj = { ...mockSecretObj };
    secret2Obj = { ...mockSecret2Obj };
  });
  afterEach(() => {
    contextObj = mockContextObj;
    secretObj = mockSecretObj;
    secret2Obj = mockSecret2Obj;
    jest.clearAllMocks();
  });
  it('should validate secret options and alert if errors', async () => {
    const getSecretsSpy = jest
      .spyOn(secreter.prototype, 'getSecrets')
      .mockResolvedValueOnce([secretObj, secret2Obj]);
    const validateSpy = jest
      .spyOn(validator.prototype, 'keyVaultSecret')
      .mockResolvedValue({ error: { message: 'this is the error' } });
    const alertSpy = jest
      .spyOn(alerter.prototype, 'send')
      .mockResolvedValueOnce(true);
    await scheduleAutomation(contextObj, true);
    expect(getSecretsSpy).toHaveBeenCalledTimes(1);
    expect(validateSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'name',
      secretObj.name,
      'Failed validation: this is the error',
      'Add or update secret options',
      secretObj.id
    );
  });
  it('should validate secret expiration and alert if true', async () => {
    const getSecretsSpy = jest
      .spyOn(secreter.prototype, 'getSecrets')
      .mockResolvedValueOnce([secretObj, secret2Obj]);
    const validateSpy = jest
      .spyOn(validator.prototype, 'keyVaultSecret')
      .mockResolvedValue(true);
    const isExpiredSpy = jest
      .spyOn(common.prototype, 'isExpired')
      .mockResolvedValueOnce(true);
    const alertSpy = jest
      .spyOn(alerter.prototype, 'send')
      .mockResolvedValueOnce(true);
    await scheduleAutomation(contextObj, true);
    expect(getSecretsSpy).toHaveBeenCalledTimes(1);
    expect(validateSpy).toHaveBeenCalledTimes(2);
    expect(isExpiredSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'name',
      secretObj.name,
      `Secret has expired: ${later}.`,
      'Rotate secret immediately! Rotate, add new version to key vault and "load" new version wherever its used. Disable or remove if secret is no longer in use.',
      secretObj.id
    );
  });
  it('should handle error', async () => {
    const getSecretsSpy = jest
      .spyOn(secreter.prototype, 'getSecrets')
      .mockResolvedValueOnce([secretObj, secret2Obj]);
    const validateError = new Error('Fake internal server error');
    const validateSpy = jest
      .spyOn(validator.prototype, 'keyVaultSecret')
      .mockImplementation(() => {
        throw validateError;
      });
    await scheduleAutomation(contextObj, true);
    expect(getSecretsSpy).toHaveBeenCalledTimes(1);
    expect(validateSpy).toThrow(validateError);
    validateSpy.mockReset();
  });
});
