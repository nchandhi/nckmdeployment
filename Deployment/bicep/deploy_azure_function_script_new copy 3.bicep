param location string = 'eastus'
param functionAppName string = 'ncfunctionapp'
param containerRegistryName string = 'kmpubliccr'
param containerImageName string = 'ncfunctionappimage:v1.0.0'
// param storageAccountName string = 'ncstorageaccount'

// resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
//   name: storageAccountName
//   location: location
//   sku: {
//     name: 'Standard_LRS'
//   }
//   kind: 'StorageV2'
// }

resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'myAppServicePlan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true  // Linux function app, so reserved should be true
  }
}

resource functionApp 'Microsoft.Web/sites@2021-02-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${containerRegistryName}.azurecr.io'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
      ]
      linuxFxVersion: 'DOCKER|${containerRegistryName}.azurecr.io/${containerImageName}'
    }
  }
}

// resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' existing = {
//   name: containerRegistryName
//   scope: resourceGroup(rgname)
// }
