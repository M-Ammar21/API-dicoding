FROM node:20

# Install necessary dependencies
RUN apt-get update \
    && apt-get install -y python3-venv python3-dev python3-pip

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Create a virtual environment for Python
RUN python3 -m venv /usr/src/app/venv

# Activate the virtual environment
ENV PATH="/usr/src/app/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Try installing node-python again
# RUN npm install node-python

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PORT=3009
ENV MONGODB_URI=

# Start the application
CMD ["npm", "run", "start"]
