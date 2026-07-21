// Babel config used only by Jest (see jest.config.js). Excludes the
// Reanimated/worklets plugin and NativeWind JSX transform, which are
// irrelevant to the Node-based db/logic tests and pull in native runtime.
module.exports = {
  presets: ['babel-preset-expo'],
};
