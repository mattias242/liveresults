# Developer shortcuts for the LiveResults web tier.
#
# Requires PHP 8.1+ and Composer. First run: `make install`.

.PHONY: install test lint

install:
	composer install

# Run the BDD/TDD suite (features/*.feature are documented as PHPUnit specs).
test:
	vendor/bin/phpunit

# Syntax-check every PHP source file.
lint:
	@find . -path ./vendor -prune -o -name '*.php' -print | xargs -n1 -P4 php -l >/dev/null && echo "lint OK"
