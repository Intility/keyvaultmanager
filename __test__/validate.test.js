const validator = require('../src/Common/validate');

describe('validate', () => {
  describe('keyValtSecret', () => {
    const obj = {
      expiresOn: '2022-02-01T00:00:00.000Z',
      createdOn: '2022-01-01T00:00:00.000Z',
      updatedOn: '2022-01-01T00:00:00.000Z',
      enabled: true,
      notBefore: '2022-01-01T00:00:00.000Z',
      recoverableDays: 90,
      recoveryLevel: 'Recoverable',
      id: 'https://keyvaultname.vault.azure.net/secrets/test/123abc',
      contentType: 'test',
      tags: {
        managed: 'true',
        autoRotate: 'false',
        owner: 'https://secret.owned.here',
        metadataUrl: 'http://localhost:7071/api/secrets/metadata',
      },
      managed: true,
      vaultUrl: 'https://keyvaultname.vault.azure.net',
      version: '123abc',
      name: 'test',
      certificateKeyId: '123',
    };
    it('should pass the validation', async () => {
      const validate = new validator();
      await expect(validate.keyVaultSecret(obj)).resolves.not.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
    it('should send error', async () => {
      const validate = new validator();
      obj.name = 1;
      await expect(validate.keyVaultSecret(obj)).resolves.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });
  describe('keyVaultSecretOptions', () => {
    const obj = {
      enabled: true,
      contentType: 'test',
      notBefore: '2022-01-01T00:00:00.000Z',
      expiresOn: '2022-02-01T00:00:00.000Z',
      tags: {
        managed: true,
        autoRotate: false,
        owner: 'https://secret.owned.here',
        metadataUrl: 'http://localhost:7071/api/secrets/metadata',
      },
    };
    it('should pass the validation', async () => {
      const validate = new validator();
      await expect(validate.keyVaultSecretOptions(obj)).resolves.not.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
    it('should send error', async () => {
      const validate = new validator();
      obj.enabled = 'whoknows';
      await expect(validate.keyVaultSecretOptions(obj)).resolves.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });
  describe('createSecret', () => {
    const obj = {
      name: 'secretName',
      value: 'topSecret!',
      enabled: true,
      contentType: 'test',
      notBefore: '2022-01-01T00:00:00.000Z',
      expiresOn: '2022-02-01T00:00:00.000Z',
      tags: {
        managed: true,
        autoRotate: false,
        owner: 'https://secret.owned.here',
      },
      metadata: {
        consumer1: 'https://secret.consumed.here',
      },
    };
    it('should pass the validation', async () => {
      const validate = new validator();
      await expect(validate.createSecret(obj)).resolves.not.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
    it('should send error', async () => {
      const validate = new validator();
      obj.name = 1;
      await expect(validate.createSecret(obj)).resolves.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });
  describe('updateSecret', () => {
    const obj = {
      enabled: true,
      contentType: 'test',
      notBefore: '2022-01-01T00:00:00.000Z',
      expiresOn: '2022-02-01T00:00:00.000Z',
      tags: {
        managed: true,
        autoRotate: false,
        owner: 'https://secret.owned.here',
      },
      metadata: {
        consumer1: 'https://secret.consumed.here',
      },
    };
    it('should pass the validation', async () => {
      const validate = new validator();
      await expect(validate.updateSecret(obj)).resolves.not.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
    it('should send error', async () => {
      const validate = new validator();
      obj.enabled = 'whoknows';
      await expect(validate.updateSecret(obj)).resolves.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });
  describe('createSecretVersion', () => {
    const obj = {
      value: 'topSecret!',
      enabled: true,
      contentType: 'test',
      notBefore: '2022-01-01T00:00:00.000Z',
      expiresOn: '2022-02-01T00:00:00.000Z',
      tags: {
        managed: true,
        autoRotate: false,
        owner: 'https://secret.owned.here',
      },
      metadata: {
        consumer1: 'https://secret.consumed.here',
      },
    };
    it('should pass the validation', async () => {
      const validate = new validator();
      await expect(validate.createSecretVersion(obj)).resolves.not.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
    it('should send error', async () => {
      const validate = new validator();
      obj.enabled = 'whoknows';
      await expect(validate.createSecretVersion(obj)).resolves.toEqual(
        expect.objectContaining({ error: expect.any(Object) })
      );
    });
  });
});
