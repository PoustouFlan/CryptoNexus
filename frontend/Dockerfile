# Stage 1: Build the production assets
FROM node:18 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . ./
RUN npm run build

# Stage 2: Serve the production assets using Nginx
FROM nginx:alpine

# Copy built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose ports 80 and 443 to the outside world
EXPOSE 80
EXPOSE 443

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

