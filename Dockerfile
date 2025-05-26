FROM maven:3.8.2-openjdk-17-slim as build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim
WORKDIR /app
RUN apt-get update
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "/app/app.jar"]
# Set a default profile if none is provided
ENV SPRING_PROFILES_ACTIVE=docker

# Use the environment variable in the entrypoint
ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar /app/app.jar"]

