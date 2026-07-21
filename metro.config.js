// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Bundle Markdown legal docs (ToS / Privacy) as assets so they can be loaded
// and displayed in-app without hardcoding the text.
config.resolver.assetExts.push('md');

module.exports = withNativeWind(config, { input: './global.css' });
