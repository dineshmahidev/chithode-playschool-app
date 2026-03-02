const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Force Metro to prioritize react-native and browser fields
// This prevents the "crypto" error in Axios 1.7+ by avoiding the node-specific distribution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = withNativeWind(config, { input: './global.css' });