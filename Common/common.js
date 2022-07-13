const { setLogLevel } = require("@azure/logger");
const Sentry = require("@sentry/node");
const { name, version } = require("../package.json");

if ([true, "true"].includes(process.env.localDev)) {
  console.log(`Authorization is disabled in local dev mode`);
}

if (
  [true, "true"].includes(process.env.localDev) &&
  [true, "true"].includes(process.env.enableAzureLogger)
) {
  // set localDev, enableAzureLogger and azureLoggerLogLevel to enable the azure logger
  setLogLevel(process.env.azureLoggerLogLevel || "error");
  console.log(
    `Azure logger enbaled with log level: ${process.env.azureLoggerLogLevel}`
  );
}

// initialize sentry for error tracking
if (process.env.sentryDSN) {
  try {
    Sentry.init({
      dsn: process.env.sentryDSN,
      environment: process.env.NODE_ENV,
      release: name + "@" + version,
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

  // authorization
  authorize(principalObect, accessLevel) {
    if ([true, "true"].includes(process.env.localDev)) {
      return;
    }

    if (!principalObect) {
      throw new Error("401");
    }

    let requiredRole = [];

    switch (accessLevel) {
      case "Reader":
        requiredRole = ["KeyVaultManagerReader", "KeyVaultManagerWriter"];
        break;
      case "Writer":
        requiredRole = ["KeyVaultManagerWriter"];
        break;
    }

    const encoded = Buffer.from(principalObect, "base64");
    const decoded = encoded.toString("ascii");
    const json = JSON.parse(decoded);

    const roles = json.claims
      .filter((claim) => claim.typ === "roles")
      .map((roleClaim) => roleClaim.val);

    if (!roles.some((role) => requiredRole.includes(role))) {
      throw new Error("403");
    }
  }

  // secret expired check
  isExpired(date) {
    const yesteryesterday = new Date();
    yesteryesterday.setDate(yesteryesterday.getDate() - 2);
    return yesteryesterday > date;
  }

  // convert tags to string
  convertTags(myObj) {
    Object.keys(myObj).forEach(function (key) {
      typeof myObj[key] === "object"
        ? replace(myObj[key])
        : (myObj[key] = String(myObj[key]));
    });
  }
};
