#!/bin/sh

SCRIPT_PATH="./node_modules/@fluencelabs/marine-worker-script/dist/marine-js.node.js"

## base64 on MacOS doesn't have -w option
if echo | base64 -w0 > /dev/null 2>&1;
then
  BASE64=$(base64 -w0 $SCRIPT_PATH)
else
  BASE64=$(base64 $SCRIPT_PATH)
fi

cat << EOF > ./src/script.ts
// auto-generated

export default "$BASE64";
EOF

pnpm tsc