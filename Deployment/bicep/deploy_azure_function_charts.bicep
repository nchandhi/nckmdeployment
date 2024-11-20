@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
param sqlServerName string
param sqlDbName string
param sqlDbUser string
@secure()
param sqlDbPwd string
param baseUrl string


var registryName = 'kmcontainerreg'
var appserviceplanname = '${solutionName}-app-serviceplan'
var functionAppName = '${solutionName}-charts-fn'
var storageaccountname = '${solutionName}chartsfnacc'
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
          value: sqlDbName
        }
        {
          name: 'SQLDB_PASSWORD'
          value: sqlDbPwd
        }
        {
          name: 'SQLDB_SERVER'
          value: sqlServerName
        }
        {
          name: 'SQLDB_USERNAME'
          value: sqlDbUser
        }
      ]
      linuxFxVersion: 'DOCKER|kmcontainerreg.azurecr.io/km-charts-function:latest'
    }
  }
}
