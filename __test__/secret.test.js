const secreter = require('../src/Common/secret');
const { SecretClient } = require('@azure/keyvault-secrets');

jest.mock('@azure/keyvault-secrets');

describe('secret', () => {
  const secretName = 'SecretName';
  const secretValue = 'Top secret!';
  const now = new Date();
  const nowIsoStr = now.toISOString();
  const laterIsoStr = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
  let secretOptions = {
    enabled: true,
    contentType: 'test',
    notBefore: nowIsoStr,
    expiresOn: laterIsoStr,
    tags: {
      managed: true,
      owner: 'https://test.test.test',
      metadataUrl: 'https://test.test.test',
    },
  };
  const secretObject = {
    name: 'SecretName',
    value: 'Top secret!',
  };
  const secretsArray = [
    {
      name: 'SecretName',
      value: 'Top secret!',
    },
    {
      name: 'SecretName2',
      value: 'Top secret2!',
    },
    {
      name: 'SecretName3',
      value: 'Top secret3!',
    },
  ];
  describe('getSecret', () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env };
    });
    afterEach(() => {
      process.env = env;
    });
    it('should return one secret object', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockGetSecret = mockSecretClientInstance.getSecret;
      mockGetSecret.mockResolvedValueOnce(secretObject);
      expect.assertions(3);
      await expect(secretClient.getSecret(secretName)).resolves.toBe(
        secretObject
      );
      expect(mockGetSecret).toHaveBeenCalledWith(secretName);
      expect(mockGetSecret).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockGetSecret = mockSecretClientInstance.getSecret;
      mockGetSecret.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(secretClient.getSecret(secretName)).rejects.toThrow();
    });
  });
  describe('getSecrets', () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env };
    });
    afterEach(() => {
      process.env = env;
    });
    it('should return array of secrets', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockGetSecrets = mockSecretClientInstance.listPropertiesOfSecrets;
      mockGetSecrets.mockImplementationOnce(() => {
        return secretsArray;
      });
      expect.assertions(3);
      await expect(secretClient.getSecrets()).resolves.toEqual(secretsArray);
      expect(mockGetSecrets).toHaveBeenCalledWith();
      expect(mockGetSecrets).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockGetSecrets = mockSecretClientInstance.listPropertiesOfSecrets;
      mockGetSecrets.mockImplementationOnce(() => {
        return new Error('Async error');
      });
      expect.assertions(1);
      await expect(secretClient.getSecrets()).rejects.toThrow();
    });
  });
  describe('createSecret', () => {
    const env = process.env;
    const mockSecretOptions = secretOptions;
    beforeEach(() => {
      process.env = { ...env };
      secretOptions = { ...mockSecretOptions };
    });
    afterEach(() => {
      process.env = env;
      secretOptions = mockSecretOptions;
    });
    it('should create a secret', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockCreateSecret = mockSecretClientInstance.setSecret;
      mockCreateSecret.mockResolvedValueOnce(secretObject);
      await expect(
        secretClient.createSecret(secretName, secretValue, secretOptions)
      ).resolves.toBe(secretObject);
      expect(mockCreateSecret).toHaveBeenCalledWith(
        secretName,
        secretValue,
        secretOptions
      );
      expect(mockCreateSecret).toHaveBeenCalledTimes(1);
      mockCreateSecret.mockReset();
    });
    it('should fail on validation', async () => {
      const secretClient = new secreter();
      secretOptions.enabled = 2;
      await expect(
        secretClient.createSecret(secretName, secretValue, secretOptions)
      ).resolves.toBe('"enabled" must be a boolean');
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockCreateSecret = mockSecretClientInstance.setSecret;
      mockCreateSecret.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        secretClient.createSecret(secretName, secretValue, secretOptions)
      ).rejects.toThrow();
      mockCreateSecret.mockReset();
    });
  });
  describe('updateSecret', () => {
    const env = process.env;
    const mockSecretOptions = secretOptions;
    beforeEach(() => {
      process.env = { ...env };
      secretOptions = { ...mockSecretOptions };
    });
    afterEach(() => {
      process.env = env;
      secretOptions = mockSecretOptions;
    });
    it('should update a secret', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockUpdateSecret = mockSecretClientInstance.updateSecretProperties;
      mockUpdateSecret.mockResolvedValueOnce(secretObject);
      await expect(
        secretClient.updateSecret(secretName, secretValue, secretOptions)
      ).resolves.toBe(secretObject);
      expect(mockUpdateSecret).toHaveBeenCalledWith(
        secretName,
        secretValue,
        secretOptions
      );
      expect(mockUpdateSecret).toHaveBeenCalledTimes(1);
    });
    it('should fail on validation', async () => {
      const secretClient = new secreter();
      secretOptions.enabled = 2;
      await expect(
        secretClient.updateSecret(secretName, secretValue, secretOptions)
      ).resolves.toBe('"enabled" must be a boolean');
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockUpdateSecret = mockSecretClientInstance.updateSecretProperties;
      mockUpdateSecret.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        secretClient.updateSecret(secretName, secretValue, secretOptions)
      ).rejects.toThrow();
    });
  });
  describe('createSecretVersion', () => {
    const env = process.env;
    const mockSecretOptions = secretOptions;
    beforeEach(() => {
      process.env = { ...env };
      secretOptions = { ...mockSecretOptions };
    });
    afterEach(() => {
      process.env = env;
      secretOptions = mockSecretOptions;
    });
    it('should create a secret version', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockCreateSecretVersion = mockSecretClientInstance.setSecret;
      mockCreateSecretVersion.mockResolvedValueOnce(secretObject);
      await expect(
        secretClient.createSecretVersion(secretName, secretValue, secretOptions)
      ).resolves.toBe(secretObject);
      expect(mockCreateSecretVersion).toHaveBeenCalledWith(
        secretName,
        secretValue,
        secretOptions
      );
      expect(mockCreateSecretVersion).toHaveBeenCalledTimes(1);
    });
    it('should fail on validation', async () => {
      const secretClient = new secreter();
      secretOptions.enabled = 2;
      await expect(
        secretClient.createSecretVersion(secretName, secretValue, secretOptions)
      ).resolves.toBe('"enabled" must be a boolean');
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockCreateSecretVersion = mockSecretClientInstance.setSecret;
      mockCreateSecretVersion.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        secretClient.createSecretVersion(secretName, secretValue, secretOptions)
      ).rejects.toThrow();
    });
  });
  describe('deleteSecret', () => {
    const env = process.env;
    beforeEach(() => {
      process.env = { ...env };
    });
    afterEach(() => {
      process.env = env;
    });
    it('should delete a secret', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockDeleteSecret = mockSecretClientInstance.beginDeleteSecret;
      mockDeleteSecret.mockImplementationOnce(() => {
        return {
          pollUntilDone: jest.fn(() => {
            return secretObject;
          }),
        };
      });
      expect.assertions(3);
      await expect(secretClient.deleteSecret(secretName)).resolves.toEqual(
        secretObject
      );
      expect(mockDeleteSecret).toHaveBeenCalledWith(secretName);
      expect(mockDeleteSecret).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const secretClient = new secreter();
      const mockSecretClientInstance = SecretClient.mock.instances[0];
      const mockDeleteSecret = mockSecretClientInstance.beginDeleteSecret;
      mockDeleteSecret.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(secretClient.deleteSecret(secretName)).rejects.toThrow();
    });
  });
});
