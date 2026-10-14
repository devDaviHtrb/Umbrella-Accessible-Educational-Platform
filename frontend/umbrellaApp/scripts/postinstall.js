const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Patch fbjs/lib/warning.js (required by react-native-web)
try {
  const fbjsLibDir = path.join(rootDir, 'node_modules', 'fbjs', 'lib');
  const fbjsWarningFile = path.join(fbjsLibDir, 'warning.js');
  const fbjsRootWarningFile = path.join(rootDir, 'node_modules', 'fbjs', 'warning.js');

  if (fs.existsSync(fbjsLibDir) && !fs.existsSync(fbjsWarningFile)) {
    const warningContent = `'use strict';
var emptyFunction = require('./emptyFunction');
var warning = emptyFunction;
if (process.env.NODE_ENV !== 'production') {
  var printWarning = function printWarning(format, ...args) {
    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.warn(message);
    }
  };
  warning = function warning(condition, format, ...args) {
    if (format === undefined) {
      throw new Error('\`warning(condition, format, ...args)\` requires a warning message argument');
    }
    if (!condition) {
      printWarning(format, ...args);
    }
  };
}
module.exports = warning;
`;
    fs.writeFileSync(fbjsWarningFile, warningContent, 'utf8');
    fs.writeFileSync(fbjsRootWarningFile, "'use strict';\nmodule.exports = require('./lib/warning');\n", 'utf8');
    console.log('[postinstall] Successfully patched fbjs/lib/warning.js');
  }
} catch (err) {
  console.warn('[postinstall] Could not patch fbjs:', err.message);
}

// 2. Patch MaterialIcons.ttf into @expo/vector-icons
try {
  const sourceFont = path.join(rootDir, 'assets', 'fonts', 'MaterialIcons.ttf');
  const targetFontDir1 = path.join(
    rootDir,
    'node_modules',
    '@expo',
    'vector-icons',
    'build',
    'vendor',
    'react-native-vector-icons',
    'Fonts'
  );
  const targetFontDir2 = path.join(rootDir, 'node_modules', '@expo', 'vector-icons', 'Fonts');

  if (fs.existsSync(sourceFont)) {
    if (fs.existsSync(path.join(rootDir, 'node_modules', '@expo', 'vector-icons'))) {
      fs.mkdirSync(targetFontDir1, { recursive: true });
      fs.copyFileSync(sourceFont, path.join(targetFontDir1, 'MaterialIcons.ttf'));

      fs.mkdirSync(targetFontDir2, { recursive: true });
      fs.copyFileSync(sourceFont, path.join(targetFontDir2, 'MaterialIcons.ttf'));
      console.log('[postinstall] Successfully patched MaterialIcons.ttf in @expo/vector-icons');
    }
  }
} catch (err) {
  console.warn('[postinstall] Could not patch MaterialIcons.ttf:', err.message);
}
