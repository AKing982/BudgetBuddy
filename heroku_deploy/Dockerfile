# Build the React frontend
FROM node:14 as frontend-build
WORKDIR /app
COPY webapps/package.json ./
RUN npm install
COPY webapps/ ./
RUN npm run build

# Build the Spring Boot backend
FROM maven:3.8.2-openjdk-17-slim as backend-build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Final image
FROM openjdk:17-jdk-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl

# Copy backend jar
COPY --from=backend-build /app/target/*.jar app.jar

# Copy frontend static files
COPY --from=frontend-build /app/build ./static

# Copy Heroku-specific properties
COPY heroku-deploy/application-heroku.properties ./application-heroku.properties

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=heroku
ENV PORT=8080

# Expose the port Heroku will use
EXPOSE $PORT

# Start the application with Heroku's dynamic port
CMD ["sh", "-c", "java -Dspring.profiles.active=heroku -Dserver.port=${PORT} -jar /app/app.jar"]