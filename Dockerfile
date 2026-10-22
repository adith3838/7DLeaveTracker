FROM eclipse-temurin:17-jre
WORKDIR /app
ARG SERVICE_MODULE
COPY ${SERVICE_MODULE}/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
