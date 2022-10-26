from node:latest

COPY package.json /working/package.json
COPY tsconfig.json /working/tsconfig.json
COPY src /working/src
RUN cd /working && npm install && npm run build

ENTRYPOINT cd /working && npm start