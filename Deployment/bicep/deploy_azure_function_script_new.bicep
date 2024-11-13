@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
param baseUrl string


var containerRegistryName = 'kmpubliccr'
var functionAppName = '${solutionName}-charts-fn'
var imageName = 'charts-function:latest'
var rgname = 'rg-km-official'
var servicePlanSku = 'Y1'
var storageAccountName = '${solutionName}-charts-fn-sa'


// Storage Account resource
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: solutionLocation
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

// App Service Plan for the Function App
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${functionAppName}-plan'
  location: solutionLocation
  kind: 'functionapp'
  sku: {
    name: servicePlanSku
    tier: 'Dynamic' // Consumption plan
  }
}

// Container Registry, assumed to already exist
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: containerRegistryName
  scope: resourceGroup(rgname)
}

// Function App Resource with Docker custom image and storage account link
resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: functionAppName
  location: solutionLocation
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    storageAccount: {
      id: storageAccount.id // Link to the storage account
    }
    siteConfig: {
      appSettings: [
        {
          name: 'DOCKER_CUSTOM_IMAGE_NAME'
          value: 'kmpubliccr.azurecr.io/charts-function:latest' // Specify custom image
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4' // Sets the Azure Functions runtime version
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://kmpubliccr.azurecr.io'
        }
      ]
    }
    httpsOnly: true
  }
  identity: {
    type: 'SystemAssigned'
  }
  dependsOn: [
    appServicePlan
    storageAccount
  ]
}
