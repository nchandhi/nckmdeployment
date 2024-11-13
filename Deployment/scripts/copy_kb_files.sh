#!/bin/bash

# Variables
storageAccount="$1"
fileSystem="$2"
accountKey="$3"
baseUrl="$4"

zipFileName1="transcriptsdata.zip"
extractedFolder1="transcriptsdata"
zipUrl1=${baseUrl}"Deployment/data/transcriptsdata.zip"

zipFileName2="transcriptstxtdata.zip"
extractedFolder2="transcriptstxtdata"
zipUrl2=${baseUrl}"Deployment/data/transcriptstxtdata.zip"

zipFileName3="ragtest.zip"
extractedFolder2="ragtest"
zipUrl2=${baseUrl}"Deployment/data/ragtest.zip"

# Download the zip file
curl --output "$zipFileName1" "$zipUrl1"
curl --output "$zipFileName2" "$zipUrl2"
curl --output "$zipFileName2" "$zipUrl3"

# Extract the zip file
unzip /mnt/azscripts/azscriptinput/"$zipFileName1" -d /mnt/azscripts/azscriptinput/"$extractedFolder1"
unzip /mnt/azscripts/azscriptinput/"$zipFileName2" -d /mnt/azscripts/azscriptinput/"$extractedFolder2"
unzip /mnt/azscripts/azscriptinput/"$zipFileName3" -d /mnt/azscripts/azscriptinput/"$extractedFolder3"

az storage fs directory upload -f "$fileSystem" --account-name "$storageAccount" -s "$extractedFolder1" --account-key "$accountKey" --recursive
az storage fs directory upload -f "$fileSystem" --account-name "$storageAccount" -s "$extractedFolder2" --account-key "$accountKey" --recursive

echo "Script Started"

pip install graphrag==0.3.6

python -m graphrag.index --root /mnt/azscripts/azscriptinput/ragtest