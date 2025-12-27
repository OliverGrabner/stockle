#!/bin/bash
set -a
source .env
set +a
./mvnw spring-boot:run
