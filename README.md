# Key vault manager

Key vault manager is a management tool to keep track of Azure Key Vault assets (like secrets). It validates the assets for necessary properties, keeps track of where they are used, near expiry and expiration and alerts you in your preferred channel (Teams, Slack, email and SMS). The tool is built as an Azure Function App. All required resources are deployed with the ARM template. You can choose if you want to deploy the Function App to an existing App Service Plan or create a new one. You can also choose to manage an existing Key Vault or deploy a new Key Vault.

Key vault manager includes event and timer triggered functions for automation as well as a CRUD API to manage secrets. The API currently supports get all secrets, get secret, post secret, patch secret, put secret version and delete secret.
The Function App has access restrictions so you will only reach it from the whitelisted IP you add during deployment. It is protected with Azure AD authentication and authorization with reader and writer roles.

## Deployment steps

### Create application

1. Sign in to your Azure tenant. Global admin or application amdin permission is required.
2. Copy [azureapp.ps1](https://github.com/Intility/keyvaultmanager/tree/main/ARM/azureapp.ps1) locally. Add the name of the resource group you are going to deploy to and the object id of the user or service principal of the account thats going run the deployment in the variables $resourceGroupName and $deploymentObjectId.
3. Open cloud shell in Azure portal and run the azureapp.ps1 script.
4. Take note of the application id and secret.

### Deploy resources

1. Sign in to your Azure tenant. Contributor, or owner if you enable delete locks, permission on the resource group is required.
2. Click the Deploy to Azure button [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fgithub.com%2FIntility%2Fkeyvaultmanager%2Ftree%2Fmain%2FARM%2Fazuredeploy.json).
3. Fill in the parameters.
4. Click deploy.

## Configure application

### API access

To configure access to the Key vault manager API you have to assign the reader or writer role. From the Azure portal navigate to Azure Active Directory, Enterprise applications, "keyvaultmanager-{id}". Click Users and groups blade, Add user/group and select users/groups and role KeyVaultManagerReader or KeyVaultManagerWriter as required.

### Alert channels

#### Teams

To configure Teams alerts create an [incoming webhook](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook#create-an-incoming-webhook) and paste the url in the app setting "teamsWebhookUrl".

#### Slack

To configure Slack alerts create an [incoming webhook](https://slack.com/help/articles/115005265063-Incoming-webhooks-for-Slack) and paste the url in the app setting "slackWebhookUrl".

#### Email (Sendgrid)

To configure email alerts create a [Sendgrid](https://sendgrid.com/) account and configure smtp and api key. Then fill in the app settings "sendgridApiKey", "sendgridFromAddress" and "sendgridToAddress".

#### SMS (Twilio)

To configure sms alerts create a [Twilio](https://twilio.com/) account and configure a message service. Then fill in the app settings "twilioAccountSid", "twilioAuthToken", "twilioMessagingSid" and "twilioToNumber".

## API documentation

Swagger docs available at https://func-kvmgr-{id}.azurewebsites.net/api/swagger.json

## Limitations

Key vault manager currently supports one key vault.\
Key vualt manager currently supports secrets (not keys and certificates).
