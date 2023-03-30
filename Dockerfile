FROM mcr.microsoft.com/azure-functions/node:4-node18-appservice

### libsecret-1-dev is needed for @azure/identity to work
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsecret-1-dev=0.20.4-2 \
    && rm -rf /var/lib/apt/lists/*

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

COPY ./src /home/site/wwwroot

WORKDIR /home/site/wwwroot

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN npm ci --only=production && \
    find /home/site/wwwroot/node_modules/ ! -user root -print0 | xargs -0 chown root:root
