FROM node:12.16.1
WORKDIR /phet
RUN npm install http-server -g
RUN npm install -g grunt-cli
COPY . /phet
CMD http-server .
EXPOSE 8080