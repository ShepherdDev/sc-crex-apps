const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * The app's screens and logic live in ../TV-Shared and are shared with the
 * Vega app. Metro watches that folder, resolves `@shared/...` to it, and
 * looks up packages for shared files from this project (TV-Shared has no
 * node_modules).
 * Files ending in .android.ts(x) are picked over the plain name here.
 *
 * @type {import('metro-config').MetroConfig}
 */
const shared = path.resolve(__dirname, '../TV-Shared');
const defaults = getDefaultConfig(__dirname);
// The React Native CLI installs a resolver that points `react-native` at the
// right platform package; ours must hand off to it, not replace it.
const upstream = defaults.resolver.resolveRequest;
const resolve = (context, moduleName, platform) =>
  upstream
    ? upstream(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

const config = {
  watchFolders: [shared],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('@shared/')) {
        const file = path.join(shared, 'src', moduleName.slice(8));
        return resolve(context, file, platform);
      }
      // Packages imported by shared files are looked up from this project,
      // as if the file lived here (TV-Shared has no node_modules).
      const bare = !moduleName.startsWith('.') && !path.isAbsolute(moduleName);
      if (bare && context.originModulePath.startsWith(shared)) {
        const here = {
          ...context,
          originModulePath: path.join(__dirname, 'index.js'),
        };
        return resolve(here, moduleName, platform);
      }
      return resolve(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaults, config);
