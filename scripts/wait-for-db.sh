#!/bin/sh
# Waits until DATABASE_URL accepts TCP connections (up to 60 seconds).
set -e
host=$(node -e "console.log(new URL(process.env.DATABASE_URL).hostname)")
port=$(node -e "const u=new URL(process.env.DATABASE_URL);console.log(u.port||5432)")
i=0
until node -e "const n=require('net');const s=n.connect(${port},'${host}');s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))" 2>/dev/null; do
  i=$((i+1)); if [ "$i" -ge 60 ]; then echo "database at ${host}:${port} not reachable" >&2; exit 1; fi
  sleep 1
done
