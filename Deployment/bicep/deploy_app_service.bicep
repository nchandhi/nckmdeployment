// ========== Key Vault ========== //
targetScope = 'resourceGroup'

@minLength(3)
@maxLength(15)
@description('Solution Name')
param solutionName string

@description('Solution Location')
param solutionLocation string

param identity string

@description('Name of App Service plan')
param HostingPlanName string = '${ solutionName }-app-service-plan'

@description('The pricing tier for the App Service plan')
@allowed(
  ['F1', 'D1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1', 'P2', 'P3', 'P4','P0v3']
)
// param HostingPlanSku string = 'B1'

param HostingPlanSku string = 'P0v3'

@description('Name of Web App')
param WebsiteName string = '${ solutionName }-app-service'

@description('Name of Application Insights')
param ApplicationInsightsName string = '${ solutionName }-app-insights'

@description('Azure OpenAI Model Deployment Name')
param AzureOpenAIModel string

@description('Azure Open AI Endpoint')
param AzureOpenAIEndpoint string = ''

@description('Azure OpenAI Key')
@secure()
param AzureOpenAIKey string

param azureOpenAIApiVersion string
param CHARTS_URL string = ''
param FILTERS_URL string = ''
param USE_GRAPHRAG string = ''
param GRAPHRAG_URL string = ''
param RAG_URL string = ''

// var WebAppImageName = 'DOCKER|byoaiacontainer.azurecr.io/byoaia-app:latest'

// var WebAppImageName = 'DOCKER|ncwaappcontainerreg1.azurecr.io/ncqaappimage:v1.0.0'

var WebAppImageName = 'DOCKER|kmpubliccr.azurecr.io/km-app1:latest'

resource HostingPlan 'Microsoft.Web/serverfarms@2020-06-01' = {
  name: HostingPlanName
  location: resourceGroup().location
  sku: {
    name: HostingPlanSku
  }
  properties: {
    name: HostingPlanName
    reserved: true
  }
  kind: 'linux'
}

resource Website 'Microsoft.Web/sites@2020-06-01' = {
  name: WebsiteName
  location: resourceGroup().location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: HostingPlanName
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: reference(ApplicationInsights.id, '2015-05-01').InstrumentationKey
        }
        {
          name: 'AZURE_OPENAI_API_VERSION'
          value: azureOpenAIApiVersion
        }
        {
          name: 'AZURE_OPENAI_MODEL'
          value: AzureOpenAIModel
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: AzureOpenAIEndpoint
        }
        {
          name: 'AZURE_OPENAI_KEY'
          value: AzureOpenAIKey
        }
        {name: 'CHARTS_URL', value: CHARTS_URL}
        {name: 'FILTERS_URL', value: FILTERS_URL}
        {name: 'GRAPHRAG_URL', value: GRAPHRAG_URL}
        {name: 'RAG_URL', value: RAG_URL}
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'UWSGI_PROCESSES'
          value: '2'
        }
        {
          name: 'UWSGI_THREADS'
          value: '2'
        }
      ]
      linuxFxVersion: WebAppImageName
    }
  }
  dependsOn: [HostingPlan]
}

resource ApplicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: ApplicationInsightsName
  location: resourceGroup().location
  tags: {
    'hidden-link:${resourceId('Microsoft.Web/sites',ApplicationInsightsName)}': 'Resource'
  }
  properties: {
    Application_Type: 'web'
  }
  kind: 'web'
}

