// Babel config for the Expo app (task 10.1).
// `babel-preset-expo` is provided transitively by `expo` and drives the
// React Native / web transforms (JSX, Flow/TS stripping, etc.).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
