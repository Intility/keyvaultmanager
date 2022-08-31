const secreter = require('../Common/secret');
const alerter = require('../Common/alert');
const validator = require('../Common/validate');
const common = require('../Common/common');

const secretClient = new secreter();
const alert = new alerter();
const validate = new validator();
const utils = new common();

module.exports = async function (context, eventGridEvent) {
  const keyVaultUrl = process.env.keyVaultUrl;
  const keyVaultName = keyVaultUrl
    .split('https://')[1]
    .split('.vault.azure.net/')[0];
  /* istanbul ignore else */
  if (
    eventGridEvent.topic === process.env.eventGridTopic &&
    eventGridEvent.data.VaultName === keyVaultName &&
    eventGridEvent.data.ObjectType === 'Secret'
  ) {
    const secretName = eventGridEvent.data.ObjectName;

    try {
      // Get the secret
      const secret = await secretClient.getSecret(secretName);
      // secret is enabled and managed
      /* istanbul ignore else */
      if (
        secret.properties.enabled &&
        secret.properties.tags.managed === 'true'
      ) {
        let facts;
        let whatToDo;
        switch (eventGridEvent.eventType) {
          case 'Microsoft.KeyVault.SecretNewVersionCreated':
            // Validate the secret
            const validation = await validate.keyVaultSecret(secret);
            // send validation error alert
            facts = `New secret failed validation: ${validation.error.message}`;
            whatToDo = `Add or update specified properties`;
            await alert.send(
              keyVaultName,
              secret.name,
              facts,
              whatToDo,
              secret.properties.id
            );
            break;
          case 'Microsoft.KeyVault.SecretNearExpiry':
            /* istanbul ignore if */
            if (secret.properties.tags.autoRotate === 'true') {
              // TODO rotate secret automatically
              context.log('Auto rotate is a future feature');
            } else {
              // send alert for manual handling
              facts = `Secret expires: ${secret.properties.expiresOn}`;
              whatToDo = `Rotate secret before it expires! Rotate, add new verstion to key vault and "load" new version wherever its used.`;
              await alert.send(
                keyVaultName,
                secret.properties.name,
                facts,
                whatToDo,
                secret.properties.id
              );
            }
            break;
          case 'Microsoft.KeyVault.SecretExpired':
            // alert (renew yesterday or disable or remove unused secret)
            facts = `Secret has expired: ${secret.properties.expiresOn} (UTC)`;
            whatToDo = `Rotate secret immediately if its still in use! Rotate, add new verstion to key vault and "load" new version wherever its used. Disable or remove if secret is no longer in use.`;
            await alert.send(
              keyVaultName,
              secret.properties.name,
              facts,
              whatToDo,
              secret.properties.id
            );
            break;
          /* istanbul ignore next */
          default:
            context.log('Not a relevant key vault event type.');
            context.log(`Event: ${JSON.stringify(eventGridEvent, null, 2)}`);
            break;
        }
      } else {
        context.log(`This secret is disabled or not enabled for management.`);
        context.log(
          `Secret enabled state: ${secret.properties.enabled}, managed state: ${secret.properties.tags.managed}`
        );
      }
    } catch (error) {
      await utils.captureException(error);
      context.log.error(
        `InvocationId: ${context.invocationId}, Error: ${error}`
      );
    }
  } else {
    context.log(
      `This event is not related to the managed key vault, or its not of type secret.`
    );
    context.log(`Env topic: ${process.env.eventGridTopic}`);
    context.log(`Event: ${JSON.stringify(eventGridEvent, null, 2)}`);
  }
};
