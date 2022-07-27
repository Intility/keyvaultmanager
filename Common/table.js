const {
  useIdentityPlugin,
  DefaultAzureCredential,
} = require('@azure/identity');
const { vsCodePlugin } = require('@azure/identity-vscode');
const { TableClient } = require('@azure/data-tables');

if ([true, 'true'].includes(process.env.localDev)) {
  // Local dev auth: ADFS not currently supported, using sp creds for now
  useIdentityPlugin(vsCodePlugin);
  console.log('Using local credentials for table auth');
}

const tableName = 'keyVaultAssetMetadata';

let client;

if ([true, 'true'].includes(process.env.localDev)) {
  // depends on azurite to emulate table storage locally
  client = TableClient.fromConnectionString(
    process.env.AzureWebJobsStorage,
    tableName
  );
} else {
  // DefaultAzureCredential
  const credential = new DefaultAzureCredential();
  // get storage account name and create the url
  const storageAccountString = process.env.AzureWebJobsStorage;
  const storageAccountName = storageAccountString
    .split('DefaultEndpointsProtocol=https;AccountName=')[1]
    .split(';AccountKey=')[0];
  const url = `https://${storageAccountName}.table.core.windows.net`;

  client = new TableClient(url, tableName, credential);
}

module.exports = class table {
  async getEntity(partitionKey, rowKey) {
    try {
      return await client.getEntity(partitionKey, rowKey);
    } catch (error) {
      console.log(`getEntity error: ${error}`);
      throw error;
    }
  }

  async createEntity(partitionKey, rowKey, dataObject) {
    const entity = {
      partitionKey: partitionKey, // ie "secret"
      rowKey: rowKey, // ie {secret id} but / converted to _ ie https:__kvname.vault.azure.net_secrets_secname
      ...dataObject,
      // ie consumer1: "", // unique id like url/uri/resourceid
      // consumer2: ...
    };

    try {
      return await client.createEntity(entity);
    } catch (error) {
      console.log(`createEntity error: ${error}`);
      throw error;
    }
  }

  async updateEntity(partitionKey, rowKey, dataObject, mode) {
    const entity = {
      partitionKey: partitionKey,
      rowKey: rowKey,
      ...dataObject,
    };

    try {
      return await client.updateEntity(entity, mode);
    } catch (error) {
      console.log(`updateEntity error: ${error}`);
      throw error;
    }
  }

  async upsertEntity(partitionKey, rowKey, dataObject, mode) {
    const entity = {
      partitionKey: partitionKey,
      rowKey: rowKey,
      ...dataObject,
    };

    try {
      return await client.upsertEntity(entity, mode);
    } catch (error) {
      console.log(`upsertEntity error: ${error}`);
      throw error;
    }
  }

  async deleteEntity(partitionKey, rowKey) {
    try {
      return await client.deleteEntity(partitionKey, rowKey);
    } catch (error) {
      console.log(`deleteEntity error: ${error}`);
      throw error;
    }
  }
};
