FROM node:22-slim

# Set the working directory
WORKDIR /app
# Copy contents of the local src directory to the container at /app
COPY . .
# Install dependencies
RUN npm install
# Expose the port the app runs on
EXPOSE 5004
# Start the app
CMD ["npm", "run", "start:production"]
