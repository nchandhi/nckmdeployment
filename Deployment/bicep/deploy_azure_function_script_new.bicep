@description('Specifies the location for resources.')
param solutionName string 
param solutionLocation string
param resourceGroupName string
param baseUrl string
// @secure()
// param azureOpenAIApiKey string
// param azureOpenAIApiVersion string
// param azureOpenAIEndpoint string
// @secure()
// param azureSearchAdminKey string
// param azureSearchServiceEndpoint string
// param azureSearchIndex string
// param sqlServerName string
// param sqlDbName string
// param sqlDbUser string
// @secure()
// param sqlDbPwd string

// param location string = 'EastUS'
// param functionAppName string = 'my-function-app'
// param registryName string = '<your-acr-name>'
// param imageName string = 'my-function-app:latest'

var registryName = 'kmpubliccr'
var functionAppName = '${ solutionName }-charts-fn'
var imageName = 'charts-function:latest'

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' existing = {
  name: registryName
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'function-app-plan'
  location: solutionLocation
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2022-03-01' = {
  name: functionAppName
  location: solutionLocation
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${imageName}'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://${acr.properties.loginServer}'
        }
      ]
    }
  }
}

// resource deploy_azure_function 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
//   kind:'AzureCLI'
//   name: 'deploy_azure_function'
//   location: solutionLocation // Replace with your desired location
//   identity:{
//     type:'UserAssigned'
//     userAssignedIdentities: {
//       '${identity}' : {}
//     }
//   }
//   properties: {
//     azCliVersion: '2.50.0'
//     primaryScriptUri: '${baseUrl}Deployment/scripts/create_azure_functions.sh' // deploy-azure-synapse-pipelines.sh
//     arguments: '${solutionName} ${solutionLocation} ${resourceGroupName} ${baseUrl} ${azureOpenAIApiKey} ${azureOpenAIApiVersion} ${azureOpenAIEndpoint} ${azureSearchAdminKey} ${azureSearchServiceEndpoint} ${azureSearchIndex} ${sqlServerName} ${sqlDbName} ${sqlDbUser} ${sqlDbPwd}' // Specify any arguments for the script
//     timeout: 'PT1H' // Specify the desired timeout duration
//     retentionInterval: 'PT1H' // Specify the desired retention interval
//     cleanupPreference:'OnSuccess'
//   }
// }


