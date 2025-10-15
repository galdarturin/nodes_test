COMPOSE ?= docker compose
SERVICE_API ?= api
SERVICE_DB ?= db

.PHONY: up migrate down clean logs-api logs-db logs-postgres

###
# START
###

up:
	$(COMPOSE) up -d --build


migrate:
	$(COMPOSE) exec -T $(SERVICE_API) node -e "require('./migrate.js').runMigrations().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)})"

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v --rmi local --remove-orphans

###
# LOGS
###

logs-api:
	$(COMPOSE) logs -f $(SERVICE_API)

logs-db:
	$(COMPOSE) logs -f $(SERVICE_DB)

logs-postgres: logs-db
