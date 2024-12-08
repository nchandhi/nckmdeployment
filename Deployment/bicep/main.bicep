// ========== main.bicep ========== //
targetScope = 'resourceGroup'

@minLength(3)
@maxLength(6)
@description('Prefix Name')
param solutionPrefix string

@description('other Location')
param otherLocation string

// @description('Fabric Workspace Id if you have one, else leave it empty. ')
// param fabricWorkspaceId string

var resourceGroupLocation = resourceGroup().location
var resourceGroupName = resourceGroup().name

var solutionLocation = resourceGroupLocation
// var baseUrl = 'https://raw.githubusercontent.com/microsoft/Build-your-own-copilot-Solution-Accelerator/main/ClientAdvisor/'
var baseUrl = 'https://raw.githubusercontent.com/nchandhi/nckmdeployment/main/'

// ========== Managed Identity ========== //
module managedIdentityModule 'deploy_managed_identity.bicep' = {
  name: 'deploy_managed_identity'
  params: {
    solutionName: solutionPrefix
    solutionLocation: solutionLocation
  }
  scope: resourceGroup(resourceGroup().name)
}

module aifoundry 'deploy_ai_foundry.bicep' = {
  name: 'deploy_ai_foundry'
  params: {
    solutionName: solutionPrefix
    solutionLocation: otherLocation
    managedIdentityObjectId:managedIdentityModule.outputs.managedIdentityOutput.objectId
  }
  scope: resourceGroup(resourceGroup().name)
}

module cosmosDBModule 'deploy_cosmos_db.bicep' = {
  name: 'deploy_cosmos_db'
  params: {
    solutionName: solutionPrefix
    solutionLocation: otherLocation
    keyVaultName: aifoundry.outputs.keyvaultName
  }
  scope: resourceGroup(resourceGroup().name)
}

//========== SQL DB Module ========== //
module sqlDBModule 'deploy_sql_db.bicep' = {
  name: 'deploy_sql_db'
  params: {
    solutionName: solutionPrefix
    solutionLocation: otherLocation
    keyVaultName: aifoundry.outputs.keyvaultName
  }
  scope: resourceGroup(resourceGroup().name)
}

resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: aifoundry.outputs.keyvaultName
}

module uploadFiles 'deploy_upload_files_script.bicep' = {
  name : 'deploy_upload_files_script'
  params:{
    solutionLocation: solutionLocation
    keyVaultName: aifoundry.outputs.keyvaultName
    baseUrl: baseUrl
    storageAccountName: keyVault.getSecret('ADLS-ACCOUNT-NAME')
    containerName: keyVault.getSecret('ADLS-ACCOUNT-CONTAINER')
    managedIdentityObjectId:managedIdentityModule.outputs.managedIdentityOutput.objectId
  }
  dependsOn:[aifoundry,keyVault]
}

// module azureFunctionsCharts 'deploy_azure_function_charts.bicep' = {
//   name : 'deploy_azure_function_charts'
//   params:{
//     solutionName: solutionPrefix
//     solutionLocation: solutionLocation
//     resourceGroupName:resourceGroupName
//     sqlServerName:sqlDBModule.outputs.sqlDbOutput.sqlServerName
//     sqlDbName:sqlDBModule.outputs.sqlDbOutput.sqlDbName
//     sqlDbUser:sqlDBModule.outputs.sqlDbOutput.sqlDbUser
//     sqlDbPwd:sqlDBModule.outputs.sqlDbOutput.sqlDbPwd
//     baseUrl:baseUrl
//   }
// }

// module azureragFunctionsRag 'deploy_azure_function_rag.bicep' = {
//   name : 'deploy_azure_function_rag'
//   params:{
//     solutionName: solutionPrefix
//     solutionLocation: solutionLocation
//     resourceGroupName:resourceGroupName
//     azureOpenAIApiKey:azOpenAI.outputs.openAIOutput.openAPIKey
//     azureOpenAIApiVersion:'2024-02-15-preview'
//     azureOpenAIEndpoint:azOpenAI.outputs.openAIOutput.openAPIEndpoint
//     azureSearchAdminKey:azSearchService.outputs.searchServiceOutput.searchServiceAdminKey
//     azureSearchServiceEndpoint:azSearchService.outputs.searchServiceOutput.searchServiceEndpoint
//     azureSearchIndex:'call_transcripts_index'
//     sqlServerName:sqlDBModule.outputs.sqlDbOutput.sqlServerName
//     sqlDbName:sqlDBModule.outputs.sqlDbOutput.sqlDbName
//     sqlDbUser:sqlDBModule.outputs.sqlDbOutput.sqlDbUser
//     sqlDbPwd:sqlDBModule.outputs.sqlDbOutput.sqlDbPwd
//     baseUrl:baseUrl
//   }
// }

// module azureFunctionURL 'deploy_azure_function_urls.bicep' = {
//   name : 'deploy_azure_function_urls'
//   params:{
//     solutionName: solutionPrefix
//     identity:managedIdentityModule.outputs.managedIdentityOutput.id
//   }
//   dependsOn:[azureFunctionsCharts,azureragFunctionsRag]
// }

// module appserviceModule 'deploy_app_service.bicep' = {
//   name: 'deploy_app_service'
//   params: {
//     identity:managedIdentityModule.outputs.managedIdentityOutput.id
//     solutionName: solutionPrefix
//     solutionLocation: solutionLocation
//     AzureOpenAIEndpoint:azOpenAI.outputs.openAIOutput.openAPIEndpoint
//     AzureOpenAIModel:'gpt-4o-mini'
//     AzureOpenAIKey:azOpenAI.outputs.openAIOutput.openAPIKey
//     azureOpenAIApiVersion:'2024-02-15-preview'
//     AZURE_OPENAI_RESOURCE:azOpenAI.outputs.openAIOutput.openAIAccountName
//     CHARTS_URL:azureFunctionURL.outputs.functionURLsOutput.charts_function_url
//     FILTERS_URL:azureFunctionURL.outputs.functionURLsOutput.filters_function_url
//     USE_GRAPHRAG:'False'
//     USE_CHAT_HISTORY_ENABLED:'True'
//     GRAPHRAG_URL:azureFunctionURL.outputs.functionURLsOutput.graphrag_function_url
//     RAG_URL:azureFunctionURL.outputs.functionURLsOutput.rag_function_url
//     AZURE_COSMOSDB_ACCOUNT: cosmosDBModule.outputs.cosmosOutput.cosmosAccountName
//     AZURE_COSMOSDB_ACCOUNT_KEY: cosmosDBModule.outputs.cosmosOutput.cosmosAccountKey
//     AZURE_COSMOSDB_CONVERSATIONS_CONTAINER: cosmosDBModule.outputs.cosmosOutput.cosmosContainerName
//     AZURE_COSMOSDB_DATABASE: cosmosDBModule.outputs.cosmosOutput.cosmosDatabaseName
//     AZURE_COSMOSDB_ENABLE_FEEDBACK:'True'
//   }
//   scope: resourceGroup(resourceGroup().name)
//   dependsOn:[azOpenAI,azAIMultiServiceAccount,azSearchService,sqlDBModule,azureFunctionURL]
// }
