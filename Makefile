.PHONY: dep lint format build test coverage audit clean
.PHONY: nodemon
.PHONY: docker-show-context docker-build

all: build
	@:

dep:
	@npm i

lint:
	@npm run lint

format:
	@npm run format

build:
	@npm run build

test:
	@npm run test

coverage:
	@npm run coverage

audit:
	@npm audit

clean:
	@-rm -f dist/index.html dist/app.js dist/styles.css

nodemon:
	@npm run nodemon

docker-show-context:
	@echo "FROM busybox\nRUN mkdir /tmp/build/\nCOPY . /tmp/build\nRUN find /tmp/build/ | xargs du -sh" \
	  | docker build --no-cache --progress=plain . -f -

docker-build:
	@docker build -t simulation .
