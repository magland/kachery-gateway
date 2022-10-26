from nikolaik/python-nodejs:python3.9-nodejs16

COPY package.json /working/package.json
COPY run.sh /working/run.sh
COPY src /working/src
COPY python /working/python
RUN cd /working && npm install

ENTRYPOINT cd /working && ./run.sh