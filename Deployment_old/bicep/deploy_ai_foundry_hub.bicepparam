using './deploy_ai_foundry_hub.bicep'

param location = 'westus'
param aiHubName = 'nctestbicephub'
param aiHubFriendlyName = aiHubName
param aiHubDescription = 'Test'
param applicationInsightsId = 'nctestbicephubappinsights'
param containerRegistryId = 'nctestbicephubacr'
param keyVaultId = 'nctestbicephubkv'
param storageAccountId = 'nctestbicephubstorage'
param aiServicesId = 'nctestbicephubaiservices'
param aiServicesTarget = 'nctestbicephubendpoint'

