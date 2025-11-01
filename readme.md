# Secure Backend Service Example

## Project

This project provides Azure Functions for managing products.

### Available Endpoints

- `GET /api/products` - List all products
- `POST /api/products` - Upsert (create or update) a product
- `PUT /api/products` - Upsert (create or update) a product

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local settings file:

Copy the template to create your local development settings:

```bash
cp local.settings.template.json local.settings.json
```

> **Note:** Never commit your `local.settings.json` to source control. The template is safe to share.

3. Build the project:

```bash
npm run build
```

## Local testing with curl

### Start the Function App

```bash
npm start
```

The function app will start on `http://localhost:7071`.

### List Products

Split the VS Code terminal so you can see the output from the localling running app whilst having a new shell prompt to make a test HTTP call:

```bash
curl -i http://localhost:7071/api/products
```

The fake repo initialises empty, so expect an empty array of products.

### Upsert a Product

Using the sample data file (and a new bash terminal):

```bash
curl -i -X POST http://localhost:7071/api/products \
  -H "Content-Type: application/json" \
  -d @samples/product-post.json
```

Repeating the list products call should now show the new item.

## Azure Setup

### Sign into Azure CLI

Prepare for using the az CLI commands.

1. Ensure you are signed in:

```bash
az login
az account show
```

You should see your account properties displayed if you are successfully signed in.

2. Ensure you know which locations (e.g. uksouth) you are permitted to use:

```bash
az policy assignment list \
  --query "[?name.contains(@, 'sys.regionrestriction')].parameters.listOfAllowedLocations.value | []" \
  -o tsv
```

### Create a Resource Group and Azure Function App

1. Create a resource group (if you do not already have one for this deployment):

```bash
az group create \
  --name <your-resource-group> \
  --location <permitted-location>
```

Remember to follow our naming convention, e.g. shopping-lab-ab47-rg

2. Create a storage account (required for Azure Functions):

```bash
az storage account create \
  --name <yourfuncstorageaccount> \
  --location <permitted-location> \
  --resource-group <your-resource-group> \
  --sku Standard_LRS
```

3. Create the Function App:

```bash
az functionapp create \
  --name <your-function-app> \
  --resource-group <your-resource-group> \
  --storage-account <yourfuncstorageaccount> \
  --consumption-plan-location <permitted-location> \
  --runtime node \
  --functions-version 4
```

### Publish the Project to Azure

Deploy your code to the Function App:

```bash
func azure functionapp publish <your-function-app>
```

You can now access your endpoints at:

```
https://<your-function-app>.azurewebsites.net/api/products
```

## Product Updated Notifications

This service emits a "product updated" integration event after a successful upsert.

- Default behaviour: uses a dummy adapter that logs the event to the console.
- HTTP adapter: enabled when the environment variable `PRODUCT_UPDATED_BASE_URL` is set.

When enabled, the service will POST to:

- `POST ${PRODUCT_UPDATED_BASE_URL}/integration/events/product-updated`

with a JSON body shaped as:

```
{
  "id": "string",
  "name": "string",
  "pricePence": 1234,
  "description": "string",
  "updatedAt": "2025-01-01T12:34:56.000Z" // ISO string
}
```

### Configure locally

Update `local.settings.json` (created from the template) to include the base URL of your receiver. If your receiver is an Azure Function protected by a host key, also include the key. The adapter uses the `x-functions-key` header automatically.

```
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "PRODUCT_UPDATED_BASE_URL": "https://your-receiver.azurewebsites.net",
    "PRODUCT_UPDATED_KEY": "<your-host-key>"
  }
}
```

Remove `PRODUCT_UPDATED_BASE_URL` (or leave it empty) to fall back to the dummy logger.

### Configure in Azure

Set the application setting `PRODUCT_UPDATED_BASE_URL` on your Function App to the receiver's base URL. If your receiver requires a host key, also set `PRODUCT_UPDATED_KEY`. The app will automatically switch to the HTTP adapter at startup.

You can set this via Azure CLI:

```bash
az functionapp config appsettings set \
  --name <your-function-app> \
  --resource-group <your-resource-group> \
  --settings \
    PRODUCT_UPDATED_BASE_URL=https://your-receiver.azurewebsites.net \
    PRODUCT_UPDATED_KEY=<your-host-key>
```

If needed, restart the Function App to pick up changes immediately:

```bash
az functionapp restart \
  --name <your-function-app> \
  --resource-group <your-resource-group>
```

If needed, allow cross-domain calls from your app domain and/or localhost, for example:

```bash
az functionapp cors add \
  --name <your-function-app> \
  --resource-group <your-resource-group> \
  --allowed-origins http://localhost:5173
```
