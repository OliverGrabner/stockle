FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://localhost:8080/api/puzzle/today || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
