.PHONY: dep lint build clean

all: build
	@:

dep:
	@npm i

lint:
	@npm run lint

build:
	@npm run build
	@npx webpack

run: build
	@echo;
	@echo "=== Press ctrl-c to stop nginx ==="
	@echo;
	@docker run --rm -it -p 8080:80 -v "${PWD}/dist/:/usr/share/nginx/html/:ro" nginx

clean:
	@-npm run clean
