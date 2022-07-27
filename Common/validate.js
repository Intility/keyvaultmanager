const Joi = require('joi').extend(require('@joi/date'));

module.exports = class validator {
  async keyVaultSecret(secret) {
    const schema = Joi.object({
      expiresOn: Joi.date().required(),
      createdOn: Joi.date(),
      updatedOn: Joi.date(),
      enabled: Joi.bool(),
      notBefore: Joi.date().required(),
      recoverableDays: Joi.number(),
      recoveryLevel: Joi.string(),
      id: Joi.string(),
      contentType: Joi.string().required(),
      tags: {
        managed: Joi.bool().required(),
        autoRotate: Joi.bool(),
        owner: Joi.string().uri().required(),
        metadataUrl: Joi.string().uri(),
      },
      managed: Joi.any(),
      vaultUrl: Joi.string(),
      version: Joi.any(),
      name: Joi.string().required(),
      certificateKeyId: Joi.any(),
    });
    return schema.validate(secret, { abortEarly: false });
  }

  async keyVaultSecretOptions(secretOptions) {
    const schema = Joi.object({
      enabled: Joi.bool().required(),
      contentType: Joi.string().required(),
      notBefore: Joi.string().isoDate().required(),
      expiresOn: Joi.string().isoDate().required(),
      tags: {
        managed: Joi.bool().required(),
        autoRotate: Joi.bool(),
        owner: Joi.string().uri().required(),
        metadataUrl: Joi.string().uri().required(),
      },
    });
    return schema.validate(secretOptions, { abortEarly: false });
  }

  async createSecret(secret) {
    const schema = Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      enabled: Joi.bool().strict().required(),
      contentType: Joi.string().required(),
      notBefore: Joi.string().isoDate().required(),
      expiresOn: Joi.string().isoDate().required(),
      tags: {
        managed: Joi.bool().strict().required(),
        autoRotate: Joi.bool().strict(),
        owner: Joi.string().uri().required(),
      },
      metadata: Joi.object().pattern(/^consumer[1-9]\d*$/, Joi.string().uri()),
    });
    return schema.validate(secret, { abortEarly: false });
  }

  async updateSecret(secretOptions) {
    const schema = Joi.object({
      enabled: Joi.bool(),
      contentType: Joi.string(),
      notBefore: Joi.string().isoDate(),
      expiresOn: Joi.string().isoDate(),
      tags: {
        managed: Joi.bool().strict(),
        autoRotate: Joi.bool(),
        owner: Joi.string().uri(),
      },
      metadata: Joi.object().pattern(/^consumer[1-9]\d*$/, Joi.string().uri()),
    });
    return schema.validate(secretOptions, { abortEarly: false });
  }

  async createSecretVersion(value) {
    const schema = Joi.object({
      value: Joi.string().required(),
      enabled: Joi.bool().strict(),
      contentType: Joi.string(),
      notBefore: Joi.string().required(),
      expiresOn: Joi.string().required(),
      tags: {
        managed: Joi.bool().strict(),
        autoRotate: Joi.bool(),
        owner: Joi.string().uri(),
      },
      metadata: Joi.object().pattern(/^consumer[1-9]\d*$/, Joi.string().uri()),
    });
    return schema.validate(value, { abortEarly: false });
  }
};
