param functionAppName string = 'ncfunctionapp2'
param location string = resourceGroup().location
param storageAccountName string = 'ncfunctionapp2adls'
param containerImageName string = 'ncfunctionappimage:v1.0.0'
param registryUrl string = 'https://kmpubliccr.azurecr.io'

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.9'
      alwaysOn: false
    }
    serverFarmId: resourceId('Microsoft.Web/serverfarms', 'myAppServicePlan') // Replace 'myAppServicePlan' with your App Service Plan name
    storageAccount: {
      name: storageAccount.name
      type: 'AzureFiles'
      accountKey: storageAccount.listKeys().keys[0].value
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

resource appSettings 'Microsoft.Web/sites/config@2022-09-01' = {
  name: 'appsettings'
  parent: functionApp
  properties: {
    'DOCKER_REGISTRY_SERVER_URL': registryUrl
    'DOCKER_REGISTRY_SERVER_USERNAME': '' // Leave empty for public registries
    'DOCKER_REGISTRY_SERVER_PASSWORD': '' // Leave empty for public registries
    'WEBSITES_ENABLE_APP_SERVICE_STORAGE': 'false'
    'FUNCTIONS_WORKER_RUNTIME': 'python'
  }
}

resource container 'Microsoft.Web/sites/containers@2022-09-01' = {
  name: 'default'
  parent: functionApp
  properties: {
    image: '${registryUrl}/${containerImageName}'
  }
}
