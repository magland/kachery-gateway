from node:latest

COPY package.json /working/package.json
COPY tsconfig.json /working/tsconfig.json

RUN cd /working && npm install

COPY src /working/src

RUN cd /working && npm run build

WORKDIR /working