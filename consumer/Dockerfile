FROM alpine

RUN apk update && apk add nodejs

RUN apk update && apk add git

RUN apk update && apk add python3

COPY . /consumer

WORKDIR /consumer

CMD [ "node","consumer.js" ]