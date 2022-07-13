FROM mcr.microsoft.com/azure-functions/node:4-node16-appservice

### libsecret-1-dev is needed for @azure/identity to work
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsecret-1-dev=0.20.4-2 \
    && rm -rf /var/lib/apt/lists/*

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY . /home/site/wwwroot

WORKDIR /home/site/wwwroot

RUN npm ci --only=production
