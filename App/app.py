import numpy as np
from quart import Quart, request, jsonify, send_from_directory
import os
from openai import AzureOpenAI
from matplotlib import pyplot as plt
import pandas as pd
import io
import base64
from quart_cors import cors
import json
import uuid
import requests
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

app = Quart(__name__)
app = cors(app, allow_origin="*")

# Serve index.html from the React build folder
@app.route('/')
async def serve_index():
    return await send_from_directory(os.path.join(app.root_path, 'frontend', 'build'), 'index.html')

@app.route("/favicon.ico") 
async def favicon():
    return await send_from_directory(
        os.path.join(app.root_path, 'frontend', 'build', 'static'),
        'favicon.ico', 
        mimetype='image/x-icon'
    )
# Serve static files (JS, CSS, images, etc.)
@app.route("/assets/<path:path>") 
async def assets(path):
    return await send_from_directory(os.path.join(app.root_path, 'frontend', 'build', 'static', 'assets'), path)


# Load environment variables
# USE_GRAPHRAG = os.getenv("USE_GRAPHRAG", "false").lower() == "true"
USE_GRAPHRAG = os.getenv("USE_GRAPHRAG", "false").strip().lower() == "true"
GRAPHRAG_URL = os.getenv("GRAPHRAG_URL", "")
RAG_URL = os.getenv("RAG_URL", "")
RAG_CHART_URL = os.getenv("RAG_CHART_URL", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_KEY", "")

# Initialize Azure OpenAI client
# client = AzureOpenAI(
#     azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"), 
#     api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
#     api_version=os.getenv("AZURE_OPENAI_API_VERSION")
# )

# deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# Load data from call_center.json
# with open('data/call_center.json') as f:
#     call_center_data = json.load(f)

# Function to wrap long labels
# def wrap_labels(labels, max_length=10):
#     wrapped_labels = []
#     for label in labels:
        # Break the label into multiple lines if it's longer than max_length
    #     wrapped_label = '\n'.join([label[i:i+max_length] for i in range(0, len(label), max_length)])
    #     wrapped_labels.append(wrapped_label)
    # return wrapped_labels

# Function to create charts
# def create_chart(chart_type: str, data: dict):
#     plt.clf()  # Clear any existing plot
#     plt.figure(figsize=(12, 7)) 
#     chart_title = data.get('title', 'Default Title')

#     if chart_type == 'line':
#         plt.plot(data['x'], data['y'], marker='o', color='b')
#         plt.title(chart_title)
#         plt.xlabel(data.get('x_label', 'X-axis'))
#         plt.ylabel(data.get('y_label', 'Y-axis'))
#     elif chart_type == 'bar':
#         # Wrap labels to prevent overlap
#         wrapped_labels = wrap_labels(data['y'])
#         plt.bar(wrapped_labels, data['x'], color='blue') 
#         plt.title(chart_title)
#         plt.xlabel('Categories')
#         plt.ylabel('Values')
#         plt.xticks(rotation=45, ha='right')  # Rotate labels for better visibility
#     elif chart_type == 'pie':
#         sizes = data.get('sizes', [])
#         labels = data.get('labels', [])
#         plt.pie(sizes, labels=labels, autopct='%1.1f%%')
    
#     elif chart_type == 'histogram':
#         plt.hist(data['values'], bins=10, color='green')
#         plt.title(chart_title)
#         plt.xlabel('Value')
#         plt.ylabel('Frequency')
#     # Save the figure to a BytesIO object and convert to base64
#     img = io.BytesIO()
#     plt.savefig(img, format='png')
#     img.seek(0)
#     img_base64 = base64.b64encode(img.getvalue()).decode('utf-8')

#     return img_base64

# @app.route('/api/chat', methods=['POST'])
# async def run_conversation():
#     # Extract the user message from the request
#     request_data = await request.get_json()
#     user_message = request_data.get('message')

#     if not user_message:
#         return jsonify({"error": "No message provided."}), 400

#     print("User's message:", user_message)
#     print("Request data:", request_data)
#     # Initial user message
#     messages = [{"role": "user", "content": user_message}]

#     # Define the function tool to create charts based on the data
#     tools = [
#         {
#             "type": "function",
#             "function": {
#                 "name": "create_chart",
#                 "description": "Creates a chart from the call center data based on the user's query.",
#                 "parameters": {
#                     "type": "object",
#                     "properties": {
#                         "chart_data": {
#                             "type": "object",
#                             "description": "Relevant chart data extracted from ${call_center_data}",
#                             "properties": {
#                                 "x": {"type": "array", "items": {"type": "number"}},
#                                 "y": {"type": "array", "items": {"type": "string"}},
#                                 "sizes": {"type": "array", "items": {"type": "number"}, "description": "Sizes for pie or bar chart."},
#                                 "labels": {"type": "array", "items": {"type": "string"}, "description": "Labels for pie chart."},
#                                 "chart_type": {
#                                     "type": "string",
#                                     "enum": ["line", "bar", "pie", "histogram"],
#                                     "description": "The type of chart that best represents the data."
#                                 },
#                                 "title": {"type": "string", "description": "Title of the chart."}
#                             },
#                             "required": ["x", "y", "sizes", "labels", "chart_type","title"]
#                         }
#                     },
#                     "required": ["chart_data"],
#                     "additionalProperties": False
#                 },
#             }
#         }
#     ]

#     try:
#         response = client.chat.completions.create(
#             model=deployment_name,
#             messages=messages,
#             tools=tools,
#             tool_choice="auto",
#         )
#     except Exception as e:
#         print("Error during OpenAI API call:", e)
#         return jsonify({"error": "Failed to communicate with the OpenAI API."}), 500

#     # Process the model's response
#     response_message = response.choices[0].message
#     messages.append({"role": response_message.role, "content": response_message.content})

#     print("Model's response:", response_message)

#     # Check if the model called a function (tool_calls)
#     if hasattr(response_message, 'tool_calls') and response_message.tool_calls:
#         for tool_call in response_message.tool_calls:
#             function_name = tool_call.function.name
#             function_args = json.loads(tool_call.function.arguments)
#             tool_call_id = tool_call.id
#             print(f"Function call: {function_name}")
#             print(f"Function arguments: {function_args}")

#             if function_name == "create_chart":
#                try:
#                     chart_data = function_args.get("chart_data", {})
#                     chart_image = create_chart(
#                         chart_type=chart_data.get("chart_type"),
#                         data={
#                             "x": chart_data.get("x", []),
#                             "y": chart_data.get("y", []),
#                             "title": chart_data.get("title", "Default Title") 
#                         }
#                     )
#                     return jsonify({
#                         # "text": "Here is your chart.",
#                         "chart_image": f"data:image/png;base64,{chart_image}"
#                     })
#                except Exception as e:
#                     print("Error generating chart:", e)
#                     return jsonify({"error": "Failed to generate the chart."}), 500
         

#     return jsonify({
#     "text": response_message.content,
#     "chart_image": None 
# })


async def complete_chat_request(request_body):
    try:
        # Determine the endpoint and query separator based on USE_GRAPHRAG
        if USE_GRAPHRAG:
            endpoint = GRAPHRAG_URL
            model_name = "graphrag-model"
            query_separator = "&"
        else:
            endpoint = RAG_URL
            model_name = "rag-model"
            query_separator = "?"

        print(f"Selected Endpoint: {endpoint}")

        # Validate the chosen endpoint
        if not endpoint:
            return jsonify({"error": "Endpoint URL is not set in the environment"}), 500

        # Extract query from request
        query = request_body.get("messages")[-1].get("content")
        print(f"Query: {query}")

        # Construct the request URL with the correct separator
        query_url = f"{endpoint}{query_separator}query={query}"
        print(f"Request URL: {query_url}")

        # Send request to the chosen endpoint
        response = requests.get(query_url, timeout=30)
        print(f"Raw response content: {response.content}")

        # Check the response status code
        if response.status_code != 200:
            error_message = response.text or "Unknown error"
            print(f"Error response text: {error_message}")
            return jsonify({"error": f"Error from endpoint: {error_message}"}), response.status_code

        # Determine if the response is JSON or plain text
        content_type = response.headers.get("Content-Type", "").lower()
        if "application/json" in content_type:
            # Parse JSON response
            response_data = response.json()
            assistant_content = response_data.get("response", response.text)
        else:
            # Handle plain text response
            assistant_content = response.text.strip().replace('\n', '<br>')

        # Prepare and return response
        return jsonify({
            "id": str(uuid.uuid4()),
            "model": model_name,
            "created": int(time.time()),
            "object": "chat.completion",
            "choices": [{
                "messages": [{
                    "role": "assistant",
                    "content": assistant_content
                }]
            }]
        })

    except Exception as e:
        print(f"Error in complete_chat_request: {str(e)}")
        return jsonify({"error": "An error occurred during processing."}), 500
    
    
@app.route('/api/chat', methods=['POST'])
async def conversation():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415
    request_json = await request.get_json()

    # Call complete_chat_request with the request JSON
    return await complete_chat_request(request_json)

@app.route('/api/env', methods=['GET'])
def get_env():
    return jsonify({
        "REACT_APP_CHART_URL": os.getenv("REACT_APP_CHART_URL"),
        "REACT_APP_FILTERS_URL": os.getenv("REACT_APP_FILTERS_URL")
    })


@app.route("/api/layout-config", methods=['GET'])
async def get_layout_config():
    layout_config_str = os.getenv("REACT_APP_LAYOUT_CONFIG", "")
    if layout_config_str:
        return layout_config_str
    return jsonify({"error": "Layout config not found in environment variables"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)