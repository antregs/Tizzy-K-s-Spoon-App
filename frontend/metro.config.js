// Firebase's JS SDK ships .cjs files; these settings keep Auth working on
// iOS, Android and web under Metro.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
