.PHONY: dep lint build clean deploy

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

deploy: build
	@$(eval $@_branch:=$(shell git rev-parse --abbrev-ref HEAD))
	@git branch -D ops-deploy > /dev/null 2>&1 || true
	@git checkout -b ops-deploy
	@git add -f dist/
	@git commit -am "deploy ops"
	@git filter-branch -f --subdirectory-filter dist/ -- ops-deploy
	@git push origin ops-deploy:gh-pages -f
	@git checkout $($@_branch)
