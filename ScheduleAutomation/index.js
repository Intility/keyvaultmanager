const common = require('../Common/common');
const secreter = require('../Common/secret');
const alerter = require('../Common/alert');
const validator = require('../Common/validate');

const utils = new common();
const secretClient = new secreter();
const alert = new alerter();
const validate = new validator();

module.exports = async function (context, _myTimer) {
  const secrets = await secretClient.getSecrets();

  return Promise.all(
    secrets.map(async (secret) => {
      // validate secret tags etc
      const validation = await validate.keyVaultSecret(secret);
      const keyVaultUrl = secret.vaultUrl;
      const keyVaultName = keyVaultUrl
        .split('https://')[1]
        .split('.vault.azure.net')[0];
      if (validation.error) {
        const facts = `Failed validation: ${validation.error.message}`;
        const whatToDo = 'Add or update tags and stuff';
        await alert.send(keyVaultName, secret.name, facts, whatToDo, secret.id);
      }
      // validate secret expiration
      const expired = utils.isExpired(secret.expiresOn);
      if (expired) {
        const facts = `Secret has expired: ${secret.expiresOn}.`;
        const whatToDo = `Rotate secret immediately if still in use! Rotate, add new version to key vault and "load" new version wherever its used. Disable or remove if secret is no longer in use.`;
        await alert.send(keyVaultName, secret.name, facts, whatToDo, secret.id);
      }

      return true;
    })
  ).catch(async (error) => {
    await utils.captureException(error);
    context.log.error(`InvocationId: ${context.invocationId}, Error: ${error}`);
  });
};
