#!/usr/bin/env bash
# Headless-Chrome smoke test: the cat runs only in the canvas that is on screen,
# honours prefers-reduced-motion, and the page throws no JS errors.
set -u
cd "$(dirname "$0")/.."

PORT=$(python3 -c 'import socket; s = socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
TMP=$(mktemp -d)
trap 'kill $SERVER 2>/dev/null; rm -rf "$TMP"' EXIT
sleep 1
URL="http://127.0.0.1:$PORT/"
fail=0

run() { # name, chrome flags...
  local name=$1; shift
  timeout 60 google-chrome --headless=new --disable-gpu --no-sandbox --user-data-dir="$TMP/profile-$name" \
    --virtual-time-budget=6000 --enable-logging=stderr --v=0 "$@" --dump-dom "$URL" >"$TMP/$name.html" 2>"$TMP/$name.err"
}
hud() { # dumped DOM file, container class -> that container's HUD text
  python3 -I -c 'import re, sys
m = re.search(r"class=\"%s\"[\s\S]*?data-cat-hud[^>]*>([^<]*)<" % sys.argv[2], open(sys.argv[1], encoding="utf-8").read())
print(m.group(1) if m else "<missing>")' "$1" "$2"
}
check() { # case name, 0 if it passed, detail
  if [ "$2" -eq 0 ]; then echo "ok   $1"; else echo "FAIL $1: $3"; fail=1; fi
}
running() { [[ "$1" != "…" && "$1" =~ EXPLORING|FOUND|EPISODE|SMELLS ]]; }

run desktop --window-size=1440,900
s=$(hud "$TMP/desktop.html" strip); g=$(hud "$TMP/desktop.html" gamewin)
running "$s" && [ "$g" = "…" ]; check "(a) desktop runs the strip only" $? "strip='$s' panel='$g'"

run mobile --window-size=390,1400
s=$(hud "$TMP/mobile.html" strip); g=$(hud "$TMP/mobile.html" gamewin)
running "$g" && [ "$s" = "…" ]; check "(b) mobile runs the panel only" $? "strip='$s' panel='$g'"

run reduced --window-size=1440,900 --force-prefers-reduced-motion
s=$(hud "$TMP/reduced.html" strip)
[[ "$s" == *SMELLS* && "$s" != *STEPS* ]]; check "(c) reduced motion stays still" $? "strip='$s'"

errs=$(grep -h "Uncaught" "$TMP"/*.err)
[ -z "$errs" ]; check "(d) no JS errors" $? "$errs"

exit $fail
