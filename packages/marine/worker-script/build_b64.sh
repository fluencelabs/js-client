#!/bin/sh

## base64 on MacOS doesn't have -w option
if echo | base64 -w0 > /dev/null 2>&1;
then
  BASE64_WEB=$(base64 -w0 ./dist/marine-js.web.js)
  BASE64_NODE=$(base64 -w0 ./dist/marine-js.node.js)
else
  BASE64_WEB=$(base64 ./dist/marine-js.web.js)
  BASE64_NODE=$(base64 ./dist/marine-js.node.js)
fi

cat << EOF > ./dist/marine-js.b64.web.js
// auto-generated
export default "$BASE64_WEB";
EOF

cat << EOF > ./dist/marine-js.b64.node.js
// auto-generated
export default "$BASE64_NODE";
EOF

cat << EOF > ./dist/marine-js.b64.node.d.ts
declare const _default: string;
export default _default;
EOF

cat << EOF > ./dist/marine-js.b64.web.d.ts
declare const _default: string;
export default _default;
EOF

