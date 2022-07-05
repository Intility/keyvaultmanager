const {
  useIdentityPlugin,
  DefaultAzureCredential,
} = require("@azure/identity");
const { vsCodePlugin } = require("@azure/identity-vscode");
const { SecretClient } = require("@azure/keyvault-secrets");
const validator = require("../Common/validate");

const validate = new validator();

if ([true, "true"].includes(process.env.localDev)) {
  // Local dev auth: ADFS not currently supported, using sp creds for now
  useIdentityPlugin(vsCodePlugin);
  console.log("Using local credentials for key vault auth");
}

// DefaultAzureCredential
const credential = new DefaultAzureCredential();
// Build the URL to reach your key vault
const url = process.env.keyVaultUrl;
// Lastly, create our secrets client and connect to the service
const client = new SecretClient(url, credential);

module.exports = class secreter {
  async getSecret(secretName) {
    try {
      return await client.getSecret(secretName);
    } catch (error) {
      console.log(`getSecret error: ${error}`);
      throw error;
    }
  }

  async getSecrets() {
    try {
      const secrets = [];
      for await (const secretProperties of client.listPropertiesOfSecrets()) {
        secrets.push(secretProperties);
      }
      return secrets;
    } catch (error) {
      console.log(`getSecrets error: ${error}`);
      throw error;
    }
  }

  async createSecret(secretName, secretValue, secretOptions) {
    // Validate the secret options
    const validation = await validate.keyVaultSecretOptions(secretOptions);
    if (validation.error) {
      console.log(`createSecret validation error: ${validation.error.message}`);
      return validation.error.message;
    }
    try {
      // create secret
      return await client.setSecret(secretName, secretValue, secretOptions);
    } catch (error) {
      console.log(`createSecret error: ${error}`);
      throw error;
    }
  }

  async updateSecret(secretName, secretVersion, secretOptions) {
    // Validate the secret options
    const validation = await validate.keyVaultSecretOptions(secretOptions);
    if (validation.error) {
      console.log(`updateSecret validation error: ${validation.error.message}`);
      return validation.error.message;
    }
    try {
      // update secret properties
      return await client.updateSecretProperties(
        secretName,
        secretVersion,
        secretOptions
      );
    } catch (error) {
      console.log(`updateSecret error: ${error}`);
      throw error;
    }
  }

  async createSecretVersion(secretName, secretValue, secretOptions) {
    // validate the secret options
    const validation = await validate.keyVaultSecretOptions(secretOptions);
    if (validation.error) {
      console.log(
        `createSecretVersion validation error: ${validation.error.message}`
      );
      return validation.error.message;
    }
    try {
      // create secret version
      return await client.setSecret(secretName, secretValue, secretOptions);
    } catch (error) {
      console.log(`createSecretVersion error: ${error}`);
      throw error;
    }
  }

  async deleteSecret(secretName) {
    try {
      // delete secret
      const deletePoller = await client.beginDeleteSecret(secretName);
      // wait until it's done
      return await deletePoller.pollUntilDone();
    } catch (error) {
      console.log(`deleteSecret error: ${error}`);
      throw error;
    }
  }
};
