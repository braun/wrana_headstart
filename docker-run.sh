docker run -p 49160:8080   -e DB_CONNECTION_STRING="${DB_CONNECTION_STRING}" -e DATABASE_NAME="${DATABASE_NAME}"  -d  $DOCKER_APP