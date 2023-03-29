const Sentry = require('@sentry/node');
const { name, version } = require('../package.json');

/* istanbul ignore next */
if ([true, 'true'].includes(process.env.localDev)) {
  console.log(`Authorization is disabled in local dev mode`);
}

/* istanbul ignore next */
if (
  [true, 'true'].includes(process.env.localDev) &&
  [true, 'true'].includes(process.env.enableAzureLogger)
) {
  // set localDev, enableAzureLogger and azureLoggerLogLevel to enable the azure logger
  const { setLogLevel } = require('@azure/logger');
  setLogLevel(process.env.azureLoggerLogLevel || 'error');
  console.log(
    `Azure logger enbaled with log level: ${process.env.azureLoggerLogLevel}`
  );
}

/* istanbul ignore next */
// initialize sentry for error tracking
if (process.env.sentryDSN) {
  try {
    Sentry.init({
      dsn: process.env.sentryDSN,
      environment: process.env.NODE_ENV,
      release: name + '@' + version,
    });
  } catch (error) {
    console.log(`Initialize Sentry error: ${error}`);
  }
}

module.exports = class common {
  // log errors to sentry
  async captureException(error) {
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }

  // error response handler
  errorResponse(context, req, error) {
    if (
      error.request.headers
        .get('user-agent')
        .includes('azsdk-js-keyvault-secrets')
    ) {
      if (error.statusCode === 403) {
        return (context.res = {
          status: 403,
          body: `Access denied, key vault manager does not have access to the key vault.`,
        });
      }
      if (error.statusCode === 404) {
        return (context.res = {
          status: 404,
          body: `Secret "${req.params.name}" was not found.`,
        });
      }
      /* istanbul ignore else */
      if (
        error.message
          .toLowerCase()
          .includes(
            'is currently in a deleted but recoverable state, and its name cannot be reused'
          )
      ) {
        return (context.res = {
          status: 409,
          body: `Secret "${req.body.name}" already exists. It is in a deleted state but can be recovered or purged.`,
        });
      }
    }
    /* istanbul ignore else */
    if (
      error.request.headers.get('user-agent').includes('azsdk-js-data-tables')
    ) {
      if (error.statusCode === 403) {
        return (context.res = {
          status: 403,
          body: `Access denied, key vault manager does not have access to the table storage.`,
        });
      }
      if (error.statusCode === 404) {
        return (context.res = {
          status: 404,
          body: `Metadata for secret "${req.params.name}" was not found.`,
        });
      }
    }

    context.log.error(
      `InvocationId: ${context.invocationId}, Error: ${error.message}`
    );
    return (context.res = {
      status: 500,
    });
  }

  // authorization
  authorize(principalObect, accessLevel) {
    if ([true, 'true'].includes(process.env.localDev)) {
      return;
    }

    if (!principalObect) {
      throw new Error('401');
    }

    let requiredRole = [];

    switch (accessLevel) {
      case 'Reader':
        requiredRole = ['KeyVaultManagerReader', 'KeyVaultManagerWriter'];
        break;
      case 'Writer':
        requiredRole = ['KeyVaultManagerWriter'];
        break;
    }

    const encoded = Buffer.from(principalObect, 'base64');
    const decoded = encoded.toString('ascii');
    const json = JSON.parse(decoded);

    const roles = json.claims
      .filter((claim) => claim.typ === 'roles')
      .map((roleClaim) => roleClaim.val);

    if (!roles.some((role) => requiredRole.includes(role))) {
      throw new Error('403');
    }
  }

  // secret expired check
  isExpired(date) {
    const yesteryesterday = new Date();
    yesteryesterday.setDate(yesteryesterday.getDate() - 2);
    return yesteryesterday > date;
  }

  // convert tags to string
  convertTags(tags) {
    Object.keys(tags).forEach((key) =>
      typeof tags[key] === 'object'
        ? this.convertTags(tags[key])
        : (tags[key] = String(tags[key]))
    );
    return tags;
  }
};
