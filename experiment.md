
# $ docker run -e "POSTGRES_PASSWORD=password" -it -p 15432:5432 postgres:16.9


dbname="development"

echo "CREATE DATABASE ${dbname}" | psql "postgres://postgres:password@0.0.0.0:15432"

pg_dump_docker_image="postgres:16.9"

cat 1.sql | psql "postgres://postgres:password@0.0.0.0:15432/${dbname}"

docker run --rm --network host ${pg_dump_docker_image} pg_dump --schema-only --no-privileges --no-owner "postgres://postgres:password@0.0.0.0:15432/${dbname}"


---------
