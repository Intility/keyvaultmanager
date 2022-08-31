const alerter = require('../src/Common/alert');
const axios = require('axios');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

jest.mock('axios');
jest.mock('twilio');
jest.mock('@sendgrid/mail');

describe('alert', () => {
  const env = process.env;
  const keyVaultName = 'KeyVault Name';
  const secretName = 'Secret Name';
  const facts = 'These are the facts';
  const whatToDo = 'You should do this';
  const kvAssetUrl = `https://${keyVaultName}.vault.azure.net/secrets/${secretName}`;
  beforeEach(() => {
    process.env = { ...env };
  });
  afterEach(() => {
    process.env = env;
  });
  describe('teams', () => {
    it('should send alert to teams if enabled', async () => {
      process.env.teamsWebhookUrl = 'true';
      const alert = new alerter();
      const sendSpy = jest.spyOn(alert, 'send');
      axios.post.mockImplementation(() => Promise.resolve(true));
      await alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);

      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(
        keyVaultName,
        secretName,
        facts,
        whatToDo,
        kvAssetUrl
      );
    });
    it('should throw if error', async () => {
      process.env.teamsWebhookUrl = 'true';
      const alert = new alerter();
      axios.post.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl)
      ).rejects.toThrow();
    });
  });

  describe('slack', () => {
    it('should send alert to slack if enabled', async () => {
      process.env.slackWebhookUrl = 'true';
      const alert = new alerter();
      const sendSpy = jest.spyOn(alert, 'send');
      axios.post.mockImplementation(() => Promise.resolve(true));
      await alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);

      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(
        keyVaultName,
        secretName,
        facts,
        whatToDo,
        kvAssetUrl
      );
    });
    it('should throw if error', async () => {
      process.env.slackWebhookUrl = 'true';
      const alert = new alerter();
      axios.post.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl)
      ).rejects.toThrow();
    });
  });

  describe('twilio', () => {
    it('should send alert to twilio if enabled', async () => {
      process.env.twilioAccountSid = 'true';
      process.env.twilioAuthToken = 'abc123';
      process.env.twilioMessagingSid = '123abc';
      process.env.twilioToNumber = '12345678';
      const alert = new alerter();
      const sendSpy = jest.spyOn(alert, 'send');
      await alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);

      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(
        keyVaultName,
        secretName,
        facts,
        whatToDo,
        kvAssetUrl
      );
    });
    it('should throw if error', async () => {
      process.env.twilioAccountSid = 'true';
      process.env.twilioAuthToken = 'abc123';
      const alert = new alerter();
      const sms = new twilio(
        process.env.twilioAccountSid,
        process.env.twilioAuthToken
      );
      sms.messages.create.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl)
      ).rejects.toThrow();
    });
  });

  describe('sendgrid', () => {
    it('should send alert to sendgrid if enabled', async () => {
      process.env.sendgridApiKey = 'true';
      const alert = new alerter();
      const sendSpy = jest.spyOn(alert, 'send');
      sgMail.send.mockImplementation(() => Promise.resolve(true));
      await alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);

      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledWith(
        keyVaultName,
        secretName,
        facts,
        whatToDo,
        kvAssetUrl
      );
    });
    it('should throw if error', async () => {
      process.env.sendgridApiKey = 'true';
      const alert = new alerter();
      sgMail.setApiKey(process.env.sendgridApiKey);
      sgMail.send.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        alert.send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl)
      ).rejects.toThrow();
    });
  });
});
