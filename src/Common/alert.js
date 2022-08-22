const axios = require('axios');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const title = 'Key vault manager';

async function msTeams(keyVaultName, secretName, facts, whatToDo, kvAssetUrl) {
  const url = process.env.teamsWebhookUrl;
  const body = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.5',
          msteams: {
            width: 'Full',
          },
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: `${title}`,
            },
            {
              type: 'TextBlock',
              text: `${title} detected the following for key vault ${keyVaultName} secret ${secretName}`,
            },
            {
              type: 'TextBlock',
              text: `Facts: ${facts}`,
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: `What to do: ${whatToDo}`,
              wrap: true,
            },
            {
              type: 'TextBlock',
              text: `Url: [${kvAssetUrl}](${kvAssetUrl})`,
            },
          ],
        },
      },
    ],
  };

  try {
    return await axios.post(url, body);
  } catch (error) {
    console.error(`teams error: ${error}`);
    throw error;
  }
}

async function slack(keyVaultName, secretName, facts, whatToDo, kvAssetUrl) {
  const url = process.env.slackWebhookUrl;
  const body = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${title} detected the following for key vault ${keyVaultName} secret ${secretName}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Facts: ${facts}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `What to do: ${whatToDo}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Url: ${kvAssetUrl}`,
        },
      },
    ],
  };

  try {
    return await axios.post(url, body);
  } catch (error) {
    console.error(`slack error: ${error}`);
    throw error;
  }
}

async function sms(keyVaultName, secretName, facts, whatToDo, kvAssetUrl) {
  const smsClient = new twilio(
    process.env.twilioAccountSid,
    process.env.twilioAuthToken
  );
  const msg = {
    body: `${title} detected the following for key vault ${keyVaultName} secret ${secretName}\nFacts: ${facts}\nWhat to do: ${whatToDo}\n${kvAssetUrl}`,
    messagingServiceSid: process.env.twilioMessagingSid,
    to: process.env.twilioToNumber,
  };
  try {
    await smsClient.messages.create(msg);
    return true;
  } catch (error) {
    console.error(`sms error: ${error}`);
    throw error;
  }
}

async function email(keyVaultName, secretName, facts, whatToDo, kvAssetUrl) {
  sgMail.setApiKey(process.env.sendgridApiKey);
  const msg = {
    to: process.env.sendgridToAddress,
    from: {
      email: process.env.sendgridFromAddress,
      name: `${title}`,
    },
    subject: `${title} alert`,
    html: `${title} detected the following for key vault ${keyVaultName} secret ${secretName}<br>Facts: ${facts}<br>What to do: ${whatToDo}<br>Url: <a href=${kvAssetUrl}>${kvAssetUrl}</a>`,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error(`email error: ${error}`);
    throw error;
  }
}

module.exports = class alerter {
  async send(keyVaultName, secretName, facts, whatToDo, kvAssetUrl) {
    if (process.env.teamsWebhookUrl) {
      await msTeams(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);
    }
    if (process.env.slackWebhookUrl) {
      await slack(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);
    }
    if (process.env.twilioAccountSid) {
      await sms(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);
    }
    if (process.env.sendgridApiKey) {
      await email(keyVaultName, secretName, facts, whatToDo, kvAssetUrl);
    }
  }
};
