@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
@secure()
param azureOpenAIApiKey string
param azureOpenAIApiVersion string
param azureOpenAIEndpoint string
@secure()
param azureSearchAdminKey string
param azureSearchServiceEndpoint string
param azureSearchIndex string
param sqlServerName string
param sqlDbName string
param sqlDbUser string
@secure()
param sqlDbPwd string
param baseUrl string

var registryName = 'kmpubliccr'
var appserviceplanname = '${solutionName}-ragapp-serviceplan'
var functionAppName = '${solutionName}-rag-fn'
var storageaccountname = '${solutionName}ragfnsacc'
var imageName = 'km-rag-function:latest'
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
          name: 'PYTHON_ENABLE_INIT_INDEXING'
          value: '1'
        }
        {
          name: 'PYTHON_ISOLATE_WORKER_DEPENDENCIES'
          value: '1'
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
        {
          name: 'AZURE_OPEN_AI_ENDPOINT'
          value: azureOpenAIEndpoint
        }
        {
          name: 'AZURE_OPEN_AI_API_KEY'
          value: azureOpenAIApiKey
        }
        {
          name: 'OPENAI_API_VERSION'
          value: azureOpenAIApiVersion
        }
        {
          name: 'AZURE_OPEN_AI_DEPLOYMENT_MODEL'
          value: 'gpt-4'
        }
        {
          name: 'AZURE_AI_SEARCH_ENDPOINT'
          value: azureSearchServiceEndpoint
        }
        {
          name: 'AZURE_AI_SEARCH_API_KEY'
          value: azureSearchAdminKey
        }
        {
          name: 'AZURE_AI_SEARCH_INDEX'
          value: azureSearchIndex
        }
      ]
      linuxFxVersion: 'DOCKER|kmpubliccr.azurecr.io/km-rag-function-new:latest'
    }
  }
}

// linuxFxVersion: 'DOCKER|kmpubliccr.azurecr.io/km-charts-function:latest'
