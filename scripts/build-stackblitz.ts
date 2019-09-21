const fs = require('fs');
const globby = require('globby');

const libsDir = './projects/ngneat';

const packages = fs.readdirSync(libsDir).map(path => {
  const pkg = fs.readFileSync(`${libsDir}/${path}/package.json`);

  return JSON.parse(pkg.toString());
});

const EXAMPLE_FILES = [
  'src/index.html',
  'angular.json',
  'src/main.ts',
  'src/environments/**',
  'src/styles.css',
  'src/polyfills.ts',
  'src/app/**/*',
  'src/assets/**/*'
];

(async () => {
  const paths = await globby(EXAMPLE_FILES, { ignore: ['**/node_modules/**'] });

  const files = paths.reduce((files, filePath) => {
    const contents = fs.readFileSync(filePath, 'utf-8');

    return { ...files, [filePath]: contents };
  }, {});

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const dependencies = packageJson.dependencies;
  const libsDependencies = packages
    .map(pkg => ({ name: pkg.name, version: pkg.version }))
    .reduce((packages, package) => {
      return { ...packages, [package.name]: package.version };
    }, {});

  const template = `
    <html>
    <head>
      <script src="https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js"></script>
    </head>
    <body>
    <script>
      const project = {
        files: ${JSON.stringify(files)},
        title: 'Transloco Example App',
        description: 'Transloco example application with common patterns and best practices',
        template: 'angular-cli',
        tags: [
          "angular",
          "angular 2",
          "i18n",
          "translate",
          "angular translate",
          "angular i18n",
          "transloco"
        ],
        dependencies: ${JSON.stringify({
          ...dependencies,
          ...libsDependencies
        })}
      };
      StackBlitzSDK.openProject(project, { newWindow: false });
    </script>
    </body>
    </html>
  `;

  fs.writeFileSync('stackblitz.html', template, 'utf-8');
})();
