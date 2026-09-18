FROM node

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

COPY backend/services/agent ./services/agent
COPY mcp-server/package*.json /mcp-server/
RUN cd /mcp-server && npm install
COPY mcp-server/src /mcp-server/src
COPY backend/shared ./shared

WORKDIR /app/services/agent

EXPOSE 8003

CMD [ "npm", "start" ]
