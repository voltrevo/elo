FROM node:16.14-alpine3.15

RUN apk add curl vim

WORKDIR /data
RUN curl -LO https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem

WORKDIR /app
ADD . /app

WORKDIR /app
CMD [ "npm", "start" ]
