# Contributing to key vault manager

Thank you for your interest in contributing to key vault manager! There are several ways you can contribute to this project.

## Ideas, feature requests, and bugs

We are open to all ideas and we want to get rid of bugs! Use the issues section to either report a new issue, provide your ideas or contribute to existing threads.

We use conventional commits with emojis. VS Code extension [here](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits)

## Code

To contribute bug fixes, features, etc:

- Install node 16 or above.
- Install Azure function core tools v4 or above. Download [here](https://go.microsoft.com/fwlink/?linkid=2174087) or read the [guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cwindows%2Ccsharp%2Cportal%2Cbash)
- Install Azure functions VS Code extension. Download [here](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions)
- Install Azurite to emulate storage. Download VS code extension [here](https://marketplace.visualstudio.com/items?itemName=Azurite.azurite)
- Clone the repository locally and open it in VS Code.
- Run npm install.
- Start Azurite Table and Blob services.
- Debug: press <kbd>F5</kbd> (by default) to start debugging.
- Run functions locally: open terminal, run cd src and then func start.
