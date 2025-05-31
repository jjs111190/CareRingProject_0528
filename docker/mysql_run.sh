#!/bin/bash

docker stop carering-mysql || true
docker rm carering-mysql || true

docker run -d \
  --name carering-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpw \
  -e MYSQL_DATABASE=carering \
  -p 3306:3306 \
  mysql:8.0