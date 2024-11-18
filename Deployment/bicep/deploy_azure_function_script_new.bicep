@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
param SQLDB_SERVER string
param SQLDB_DATABASE string
param SQLDB_USERNAME string
param SQLDB_PASSWORD string
param baseUrl string


var registryName = 'kmpubliccr'
var appserviceplanname = '${solutionName}-app-serviceplan'
var functionAppName = '${solutionName}-charts-fn'
var storageaccountname = '${solutionName}fnsacc'
var imageName = 'km-charts-function:latest'
var rgname = 'rg-km-official'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appserviceplanname
  location: solutionLocation
  sku: {
    name: 'EP2'
    tier: 'ElasticPremium'
    family: 'EP'
  }
  kind: 'elastic'
  properties: {
    maximumElasticWorkerCount: 20
    reserved: true
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageaccountname
  location: solutionLocation
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  // properties: {
  //   supportsHttpsTrafficOnly: true
  //   defaultToOAuthAuthentication: true
  //   allowBlobPublicAccess: false
  // }
}


resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: solutionLocation
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true
    siteConfig: {
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageaccountname};EndpointSuffix=core.windows.net;AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'SQLDB_DATABASE'
          value: SQLDB_DATABASE
        }
        {
          name: 'SQLDB_PASSWORD'
          value: SQLDB_PASSWORD
        }
        {
          name: 'SQLDB_SERVER'
          value: SQLDB_SERVER
        }
        {
          name: 'SQLDB_USERNAME'
          value: SQLDB_USERNAME
        }
      ]
      linuxFxVersion: 'DOCKER|kmpubliccr.azurecr.io/km-charts-function-new:latest'
    }
  }
}

// linuxFxVersion: 'DOCKER|kmpubliccr.azurecr.io/km-charts-function:latest'
