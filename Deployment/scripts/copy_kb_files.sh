#!/bin/bash

# Variables
storageAccount="$1"
fileSystem="$2"
# accountKey="$3"
baseUrl="$3"
# azureOpenAIApiKey="$4"
# azureOpenAIEndpoint="$5"
# azureSearchAdminKey="$6"
# azureSearchServiceEndpoint="$7"

zipFileName1="transcriptsdata.zip"
extractedFolder1="transcriptsdata"
zipUrl1=${baseUrl}"Deployment/data/transcriptsdata.zip"

zipFileName2="audiodata.zip"
extractedFolder2="audiodata"
zipUrl2=${baseUrl}"Deployment/data/audiodata.zip"

# zipFileName2="transcriptstxtdata.zip"
# extractedFolder2="input"
# zipUrl2=${baseUrl}"Deployment/data/transcriptstxtdata.zip"

# zipFileName3="ragtest.zip"
# extractedFolder3="ragtest"
# zipUrl3=${baseUrl}"Deployment/data/ragtest.zip"

# graphragfileSystem="graphrag"

# Download the zip file
curl --output "$zipFileName1" "$zipUrl1"
curl --output "$zipFileName2" "$zipUrl2"
# curl --output "$zipFileName2" "$zipUrl2"
# curl --output "$zipFileName3" "$zipUrl3"

# Extract the zip file
unzip /mnt/azscripts/azscriptinput/"$zipFileName1" -d /mnt/azscripts/azscriptinput/"$extractedFolder1"
unzip /mnt/azscripts/azscriptinput/"$zipFileName2" -d /mnt/azscripts/azscriptinput/"$extractedFolder2"
# unzip /mnt/azscripts/azscriptinput/"$zipFileName2" -d /mnt/azscripts/azscriptinput/"$extractedFolder2"
# unzip /mnt/azscripts/azscriptinput/"$zipFileName3" -d /mnt/azscripts/azscriptinput/"$extractedFolder3"

echo "Script Started"

# sed -i "s/<STORAGE_ACCOUNT_TO_BE_REPLACED>/${storageAccount}/g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# sed -i "s/<GRAPHRAG_API_KEY_TO_BE_REPLACED>/${azureOpenAIApiKey}/g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# # sed -i "s/<AOAI_TO_BE_REPLACED>/${azureOpenAIEndpoint}/g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# sed -i "s|<AOAI_TO_BE_REPLACED>|${azureOpenAIEndpoint}|g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# # sed -i "s/<AI_SEARCH_TO_BE_REPLACED>/${azureSearchServiceEndpoint}/g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# sed -i "s|<AI_SEARCH_TO_BE_REPLACED>|${azureSearchServiceEndpoint}|g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"
# sed -i "s/<AI_SEARCH_KEY_TO_BE_REPLACED>/${azureSearchAdminKey}/g" "/mnt/azscripts/azscriptinput/ragtest/settings.yaml"

az login --identity

az storage blob upload-batch --account-name "$storageAccount" --destination data/"$extractedFolder1" --source /mnt/azscripts/azscriptinput/"$extractedFolder1" --auth-mode login --pattern '*'
az storage blob upload-batch --account-name "$storageAccount" --destination data/"$extractedFolder2" --source /mnt/azscripts/azscriptinput/"$extractedFolder2" --auth-mode login --pattern '*'

# az storage fs directory upload -f "$fileSystem" --account-name "$storageAccount" -s "$extractedFolder1" --account-key "$accountKey" --recursive
# az storage fs directory upload -f "$graphragfileSystem" --account-name "$storageAccount" -s "$extractedFolder2" --account-key "$accountKey" --recursive
# az storage fs directory upload -f "$graphragfileSystem" --account-name "$storageAccount" -s "$extractedFolder3" --account-key "$accountKey" --recursive

# requirementFile="graphrag-requirements.txt"
# requirementFileUrl=${baseUrl}"Deployment/scripts/graphrag-requirements.txt"
# curl --output "$requirementFile" "$requirementFileUrl"
# pip install -r graphrag-requirements.txt
# python -m graphrag index --root /mnt/azscripts/azscriptinput/ragtest
# # pip install graphrag==0.3.6

# # python -m graphrag.index --root /mnt/azscripts/azscriptinput/ragtest
# # python -m graphrag index --root ./ragtest
