FROM mhart/alpine-node:10

WORKDIR /opt/service

COPY package.json package.json  
RUN apk add --no-cache --virtual build_tools make gcc g++ python && npm install -g @xlr8/tools && npm install -q && apk del build_tools
RUN apk add git
ADD ./src /opt/service/src

ENV NODE_ENV production

EXPOSE 3000

ENTRYPOINT ["xlr8", "start", "--k8s=cluster"]
