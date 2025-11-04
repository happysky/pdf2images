FROM node


COPY package.json .npmrc yarn.lock /usr/
WORKDIR /usr/
RUN yarn install
ENV TZ Asia/Shanghai
ENV NODE_ENV production
ENV PATH /usr/node_modules/.bin:$PATH
WORKDIR /usr/app/

EXPOSE 3000
ENTRYPOINT ["node", "index.js"]