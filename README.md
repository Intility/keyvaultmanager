# Key vault manager

Key vault manager is a management tool to keep track of key vault assets (like secrets). It validates the assets for necessary properties, keeps track of where they are used, near expiry and expiration and alerts you in your preferred channel (MS Teams, Slack, email and sms). The tool is built as an azure function. All required resources are deployed with the arm template. You can choose if you want to deploy the function app to an existing app service plan or create a new one. You can also choose to manage an existing key vault or deploy a new key vault.

Key vault manager includes event and timer triggered functions for automation as well as a CRUD api to manage secrets. The api currently supports get all secrets, get a specific secret, post a secret, patch a secret, put a secret version and delete a secret.
The function app has access restrictions so you will only reach it from the whitelisted IP you added during deployment. It is also protected with azure ad authentication, and authorization with reader and writer roles.

Current version supports management of one key vault and asset type secrets. (Yes im considering adding support for keys and certificates and make it able to manage multiple key vaults).

## Deployment steps

1. create application
   a. sign in to your azure tenant. global admin or application admin permission required
   b. copy azureapp.ps1 and add your resource group name and deployment object id (user or sp)
   c. run azureapp.ps1 script in cloud shell
   d. take note of app id, secret
   e. assign users read or write roles as required

2. deploy resources
   a. sign in to your azure tenant. contributor (or owner if you enable delete locks) permission on resource group required
   b. click deploy to azure button
   c. fill in parameters
   d. click deploy

### Create application

blabla

### Deploy resources

bla bla

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fgitlab.intility.com%2FJonatan.Vik%2Farm-secretsrotation%2F-%2Fraw%2Fmain%2Fazuredeploy.json)

## API documentation

Swagger docs available at https://funcname.azurewebsites.net/api/swagger.json
