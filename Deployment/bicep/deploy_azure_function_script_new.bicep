@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
param baseUrl string


var registryName = 'kmpubliccr'
var functionAppName = '${solutionName}-charts-fn'
var imageName = 'charts-function:latest'
var rgname = 'rg-km-official'

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: registryName
  scope: resourceGroup(rgname)
}

resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'myAppServicePlan'
  location: solutionLocation
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true  // Linux function app, so reserved should be true
  }
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: solutionLocation
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        { name: 'DOCKER_CUSTOM_IMAGE_NAME', value: 'kmpubliccr.azurecr.io/charts-function:latest' }
      ]
    }
  }
}
 