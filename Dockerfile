# Use official node image as the base image
FROM node:latest as build
LABEL maintainer="Eko Indarto <eko.indarto@dans.knaw.nl>"

# Set the working directory
WORKDIR /usr/local/app

#Install git and angular cli
RUN apt-get install git && npm install -g @angular/cli

# Clone dataverse data explorer
RUN git clone https://github.com/scholarsportal/dataverse-data-explorer-v2

# Compile, Build angular codebase and Generate the build of the application
RUN cd dataverse-data-explorer-v2 && npm install && ng build --prod --base-href /

# Serve dataverse data explorer with nginx server
# Use official nginx image as the base image
FROM nginx:latest

# Copy the build output to replace the default nginx contents.
COPY --from=build /usr/local/app/dataverse-data-explorer-v2/dist/dataverse-data-explorer-v2 /usr/share/nginx/html

EXPOSE 5000
#Replace the config port 80 to 5000 on every start
CMD ["/bin/sh", "-c", "sed -i 's/listen  .*/listen 5000;/g' /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]

