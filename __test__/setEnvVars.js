process.env.AzureWebJobsStorage =
  'DefaultEndpointsProtocol=https;AccountName=storageaccountname;AccountKey=key;EndpointSuffix=core.windows.net';
process.env.localDev = false;
process.env.keyVaultUrl = 'https://name.vault.azure.net/';
process.env.eventGridTopic =
  '/subscriptions/123abc/resourceGroups/name/providers/Microsoft.KeyVault/vaults/name';
