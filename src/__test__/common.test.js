const Sentry = require('@sentry/node');
const common = require('../Common/common');

describe('common', () => {
  describe('captureException', () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env };
    });
    afterEach(() => {
      process.env = env;
    });
    it('should capture error and flush', async () => {
      const utils = new common();
      const captureExceptionSpy = jest.spyOn(utils, 'captureException');
      const sentrycaptureExceptionSpy = jest.spyOn(Sentry, 'captureException');
      const sentryFlushSpy = jest.spyOn(Sentry, 'flush');
      const error = new Error('Error');
      await utils.captureException(error);
      expect(captureExceptionSpy).toHaveBeenCalledWith(error);
      expect(sentrycaptureExceptionSpy).toHaveBeenCalledWith(error);
      expect(sentryFlushSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('errorResponse', () => {
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
    const mockContextObj = contextObj;
    const mockReqObj = reqObj;
    const mockErrorObj = errorObj;
    beforeEach(() => {
      contextObj = { ...mockContextObj };
      reqObj = { ...mockReqObj };
      errorObj = { ...mockErrorObj };
    });
    afterEach(() => {
      contextObj = mockContextObj;
      reqObj = mockReqObj;
      errorObj = mockErrorObj;
    });
    it('should return correct error message (azsdk-js-keyvault-secrets - 403)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      errorObj.request.headers.set('user-agent', 'azsdk-js-keyvault-secrets');
      errorObj.statusCode = 403;
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 403,
        body: `Access denied, key vault manager does not have access to the key vault.`,
      });
    });
    it('should return correct error message (azsdk-js-keyvault-secrets - 404)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      errorObj.request.headers.set('user-agent', 'azsdk-js-keyvault-secrets');
      errorObj.statusCode = 404;
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 404,
        body: `Secret "${reqObj.params.name}" was not found.`,
      });
    });
    it('should return correct error message (azsdk-js-keyvault-secrets - 409)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      errorObj.request.headers.set('user-agent', 'azsdk-js-keyvault-secrets');
      errorObj.message =
        'is currently in a deleted but recoverable state, and its name cannot be reused';
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 409,
        body: `Secret "${reqObj.body.name}" already exists. It is in a deleted state but can be recovered or purged.`,
      });
    });
    it('should return correct error message (azsdk-js-data-tables - 403)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      errorObj.request.headers.set('user-agent', 'azsdk-js-data-tables');
      errorObj.statusCode = 403;
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 403,
        body: `Access denied, key vault manager does not have access to the table storage.`,
      });
    });
    it('should return correct error message (azsdk-js-data-tables - 404)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      errorObj.request.headers.set('user-agent', 'azsdk-js-data-tables');
      errorObj.statusCode = 404;
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 404,
        body: `Metadata for secret "${reqObj.params.name}" was not found.`,
      });
    });
    it('should return correct error message (default - 500)', () => {
      const utils = new common();
      const errorResponseSpy = jest.spyOn(utils, 'errorResponse');
      utils.errorResponse(contextObj, reqObj, errorObj);
      expect(errorResponseSpy).toHaveReturnedWith({
        status: 500,
      });
    });
  });
  describe('authorize', () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env };
    });
    afterEach(() => {
      process.env = env;
    });

    it('should continue if local dev mode', () => {
      process.env.localDev = true;
      process.env.enableAzureLogger = true;
      const utils = new common();
      const authorizeSpy = jest.spyOn(utils, 'authorize');
      utils.authorize();
      expect(authorizeSpy).toHaveBeenCalledTimes(1);
      expect(authorizeSpy).toHaveReturnedWith();
    });

    it('should throw error 401', () => {
      const utils = new common();
      expect(() => {
        utils.authorize();
      }).toThrow('401');
    });

    it('should throw 403 if missing role', () => {
      const utils = new common();
      const principalObect = {
        claims: [
          {
            typ: 'roles',
            val: 'Not a valid role',
          },
        ],
      };
      const accessLevel = 'Nope';
      const poString = JSON.stringify(principalObect);
      const poB64 = Buffer.from(poString).toString('base64');
      expect(() => {
        utils.authorize(poB64, accessLevel);
      }).toThrow('403');
    });

    it('should continue if reader role', () => {
      const utils = new common();
      const principalObect = {
        claims: [
          {
            typ: 'roles',
            val: 'KeyVaultManagerReader',
          },
        ],
      };
      const accessLevel = 'Reader';
      const poString = JSON.stringify(principalObect);
      const poB64 = Buffer.from(poString).toString('base64');
      const authorizeSpy = jest.spyOn(utils, 'authorize');
      utils.authorize(poB64, accessLevel);
      expect(authorizeSpy).toHaveBeenCalled();
    });

    it('should continue if writer role', () => {
      const utils = new common();
      const principalObect = {
        claims: [
          {
            typ: 'roles',
            val: 'KeyVaultManagerWriter',
          },
        ],
      };
      const accessLevel = 'Writer';
      const poString = JSON.stringify(principalObect);
      const poB64 = Buffer.from(poString).toString('base64');
      const authorizeSpy = jest.spyOn(utils, 'authorize');
      utils.authorize(poB64, accessLevel);
      expect(authorizeSpy).toHaveBeenCalled();
    });
  });

  describe('isExpired', () => {
    it('Should return true when date is more than two days old', () => {
      const utils = new common();
      const now = new Date();
      now.setDate(now.getDate() - 3);
      expect(utils.isExpired(now)).toBeTruthy();
    });

    it('Should return false when date is less than two days old', () => {
      const utils = new common();
      const now = new Date();
      expect(utils.isExpired(now)).toBeFalsy();
    });

    it('Should return false when date is exactly two days', () => {
      const utils = new common();
      const now = new Date();
      now.setDate(now.getDate() - 2);
      expect(utils.isExpired(now)).toBeFalsy();
    });
  });

  describe('convertTags', () => {
    it('should convert all !string values to string values', () => {
      const utils = new common();
      const tags = {
        key1: 1,
        key2: false,
        key3: 'string',
        key4: {
          key5: true,
        },
      };
      utils.convertTags(tags);
      Object.values(tags).forEach((value) => {
        if (typeof value === 'object') {
          Object.values(value).forEach((innerValue) => {
            expect(typeof innerValue).toBe('string');
          });
        } else {
          expect(typeof value).toBe('string');
        }
      });
    });
  });
});
