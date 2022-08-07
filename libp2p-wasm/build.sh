wasm-pack build --target web --dev
(
  cd npm-package || exit;
  npm i;
  npm run build
)
