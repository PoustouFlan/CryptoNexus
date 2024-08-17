# Stage 1: Build the project using Maven
FROM maven:3.8.5-openjdk-17 AS build

# Set the working directory
WORKDIR /build

# Copy the Maven wrapper and pom.xml to the container
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./

# Copy the source code
COPY src ./src

# Ensure the mvnw file is executable
RUN chmod +x mvnw

# Build the application using Maven
RUN unset MAVEN_CONFIG && ./mvnw clean package -DskipTests

# Stage 2: Run the application using a JRE image
FROM eclipse-temurin:17-jre as runtime

# Set the working directory
WORKDIR /app

# Copy the built application from the previous stage
COPY --from=build /build/target/quarkus-app/lib/ /app/lib/
COPY --from=build /build/target/quarkus-app/app/ /app/app/
COPY --from=build /build/target/quarkus-app/quarkus/ /app/quarkus/
COPY --from=build /build/target/quarkus-app/quarkus-run.jar /app/quarkus-run.jar

# Expose the default port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "/app/quarkus-run.jar"]
