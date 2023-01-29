FROM alpine

RUN apk update && apk add nodejs

COPY . /server

WORKDIR /server

CMD ["node","server.js"]