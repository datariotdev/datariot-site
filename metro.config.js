const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.maxWorkers = 2;
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
};

module.exports = config;
