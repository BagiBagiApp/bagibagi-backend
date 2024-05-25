FROM node:20
WORKDIR /app
ENV PORT 5000
ENV JWT_SECRET_KEY=mysecretkey
COPY . .
RUN npm install
EXPOSE 5000
CMD [ "npm", "start"]