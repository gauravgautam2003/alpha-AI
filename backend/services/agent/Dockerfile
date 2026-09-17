FROM node

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

COPY backend/services/agent ./services/agent
COPY mcp-server ./mcp-server
COPY backend/shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD [ "npm", "start" ]
