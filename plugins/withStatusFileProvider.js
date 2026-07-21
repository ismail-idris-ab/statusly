const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const AUTHORITY_SUFFIX = '.statusprovider';

const FILE_PATHS_XML = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
  <cache-path name="statuses" path="statuses/" />
  <cache-path name="cache" path="." />
</paths>
`;

/** Declares a FileProvider so cached statuses can be shared to other apps. */
function addFileProvider(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      cfg.modResults,
    );
    const authority = `${config.android.package}${AUTHORITY_SUFFIX}`;
    app.provider = app.provider || [];
    const exists = app.provider.some(
      (p) => p.$['android:authorities'] === authority,
    );
    if (!exists) {
      app.provider.push({
        $: {
          'android:name': 'androidx.core.content.FileProvider',
          'android:authorities': authority,
          'android:exported': 'false',
          'android:grantUriPermissions': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.support.FILE_PROVIDER_PATHS',
              'android:resource': '@xml/statusly_file_paths',
            },
          },
        ],
      });
    }
    return cfg;
  });
}

/** Writes the FileProvider paths config into res/xml. */
function addFilePathsXml(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'statusly_file_paths.xml'),
        FILE_PATHS_XML,
      );
      return cfg;
    },
  ]);
}

module.exports = function withStatusFileProvider(config) {
  return addFilePathsXml(addFileProvider(config));
};
