check-test:
	@@if ! test -x ./node_modules/.bin/mocha; then \
	    NODE_ENV=dev npm install; \
	    if ! test -x ./node_modules/.bin/mocha; then \
		echo ERROR: mocha missing >&2; \
		exit 1; \
	    fi; \
	fi

clean-common:
	@@if test -s .gitignore; then \
	    while read pattern; \
		do \
		    if test "$$pattern" = / -o "$$pattern" = '*' -o "$$pattern" = '/*'; then \
			echo "WARNING: suspicous-looking gitignore entry - skipping $$pattern" >&2; \
		    elif echo "$$pattern" | grep '^/' >/dev/null; then \
			rm -fr ".$$pattern"; \
		    else \
			rm -fr "$$pattern"; \
		    fi; \
		done <.gitignore; \
	    echo "NOTICE: done dropping items matching gitignore entries"; \
	fi

clean-npm:
	@@if test -s .npmignore; then \
	    while read pattern; \
		do \
		    if test "$$pattern" = / -o "$$pattern" = '*' -o "$$pattern" = '/*'; then \
			echo "WARNING: suspicous-looking npmignore entry - skipping $$pattern" >&2; \
		    elif echo "$$pattern" | grep '^/' >/dev/null; then \
			rm -fr ".$$pattern"; \
		    else \
			rm -fr "$$pattern"; \
		    fi; \
		done <.npmignore; \
	    echo "NOTICE: done dropping items matching npmignore entries"; \
	fi

unit-test:
	for _t in tests/*.js; \
	    do \
		./node_modules/.bin/mocha --exit $$_t || exit 1; \
	    done

test: check-test unit-test clean-common
