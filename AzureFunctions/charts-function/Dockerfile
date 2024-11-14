# Use the official Azure Functions runtime image for Python
FROM mcr.microsoft.com/azure-functions/python:4-python3.9

# Set working directory and copy function app code
WORKDIR /home/site/wwwroot
COPY . /home/site/wwwroot

# Install dependencies
RUN pip install -r requirements.txt