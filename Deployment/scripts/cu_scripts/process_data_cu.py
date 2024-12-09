from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
from azure.identity import DefaultAzureCredential
import pandas as pd
from datetime import datetime, timedelta 

# Create a Azure credential object
credential = DefaultAzureCredential()

# Initialize Blob Storage
## Get storage information from environment variables
BLOB_ENDPOINT = 'https://nc2202storageaccount.blob.core.windows.net/' #os.getenv("BLOB_ENDPOINT")
BLOB_CONTAINER_NAME_AUDIO = 'data' #os.getenv("BLOB_CONTAINER_NAME_AUDIO")

data = None
## Initialize BlobServiceClient
blob_service_client = BlobServiceClient(account_url=BLOB_ENDPOINT, credential=credential)
# results_container_client = blob_service_client.get_container_client(container=BLOB_CONTAINER_NAME)
audio_container_client = blob_service_client.get_container_client(container=BLOB_CONTAINER_NAME_AUDIO)

# Set blob folder to process
blob_folder_list = ['audio']
output_folder_blob = 'cu_output'

## Set analyzer_name for testing with other previously created analyzers
analyzer_name = "ckm-analyzer"

# Get the analyzer configuration
analyzer_config = list_analyzer(analyzer_name)
analyzer_id = analyzer_config["analyzerId"]
print(f"Analyzer ID: {analyzer_id}")
# Get timestamp and create output folder
timestamp = time.strftime("%Y%m%d-%H%M%S")

headers = {
    'Ocp-Apim-Subscription-Key': API_KEY,
    'Content-Type': 'application/json',
    'cogsvc-videoanalysis-face-identification-enable': "true"
}

finalresult = []
blob_folder = blob_folder_list[0]
audio_data_client = ContainerClient.list_blobs(self = audio_container_client, name_starts_with=blob_folder)
results_folder_blob = 'calltranscriptsoutput'
results_container_client = blob_service_client.get_container_client(container=BLOB_CONTAINER_NAME_AUDIO)

# Process files from blob storage
for blob in audio_data_client:
    if blob.name.startswith('labelingProjects'):
        print('Skipping AI Foundry project working folder: ' + blob.name)

    if blob.name.startswith(blob_folder) and blob.name.endswith('.wav'):
        print(f"\nFile: {blob.name}")            
        blob_client = audio_container_client.get_blob_client(blob)
        blob_url = blob_client.url
        # print(f"Blob URL: {blob_url}")

        data = {
            "url": blob_url
        }

        data = json.dumps(data)

        # Construct the request URL
        url = f"{AISERVICE_ENDPOINT}{PATH_ANALYZER_INFERENCE.format(analyzerId=analyzer_id)}{API_VERSION}"
        # print(url)
        # Make the POST request
        response = requests.post(url, headers=headers, data=data)
        # print(response)
        operation_location = response.headers.get('Operation-Location')
      
        # Poll for results
        result = poll_for_results(operation_location, 'Succeeded', 'Failed')
        # print(result)
        file_name = (blob.name).split('/')[-1]
        start_time = file_name.replace(".wav", "")[-19:]
        timestamp_format = "%Y-%m-%d %H_%M_%S"  # Adjust format if necessary
        start_timestamp = datetime.strptime(start_time, timestamp_format)
        start_date = start_timestamp.strftime("%Y-%m-%d")
        conversation_id = file_name.split('convo_', 1)[1].split('_')[0]
        duration = int(result['result']['contents'][0]['fields']['Duration']['valueString'])
        end_timestamp = str(start_timestamp + timedelta(milliseconds=duration))
        end_timestamp = end_timestamp.split(".")[0]
        # print(result)
        conversationRow = {
            "conversationId": conversation_id,
            "ConversationDate": start_date,
            "StartTime": str(start_timestamp),
            "Duration": duration,
            "EndTime": str(end_timestamp),
            "Content": result['result']['contents'][0]['fields']['content']['valueString'],
            "summary": result['result']['contents'][0]['fields']['summary']['valueString'],
            "satisfied": result['result']['contents'][0]['fields']['satisfied']['valueString'],
            "sentiment": result['result']['contents'][0]['fields']['sentiment']['valueString'],
            "topic": result['result']['contents'][0]['fields']['topic']['valueString'],
            "keyPhrases": result['result']['contents'][0]['fields']['keyPhrases']['valueString'],
            "complaint": result['result']['contents'][0]['fields']['complaint']['valueString']
        }

        filename = 'convo_' + str(conversation_id) + '_'+ str(start_time) + '.json'
        processed_path = 'cu_processed_files/'
        json.dump(conversationRow, open(processed_path + filename, 'w'), indent=4)

        output_blob = f"{output_folder_blob}/{(blob.name).split('/')[-1]}.results.json"
        print((blob.name).split('/')[-1])
        # Write the results to blob storage as json file
        result_data = json.dumps(jsonresult, indent=4)
        print(result_data)
        blob_results_client = results_container_client.get_blob_client(output_blob)
        blob_results_client.upload_blob(result_data, overwrite=True)
        break