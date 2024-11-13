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

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'function-app-plan'
  location: solutionLocation
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: ''
}

resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: functionAppName
  location: solutionLocation
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|kmpubliccr.azurecr.io/charts-function:latest'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://kmpubliccr.azurecr.io'
        }
      ]
    }
  }
}
