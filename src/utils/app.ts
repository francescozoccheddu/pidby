import findPackageJson from 'find-package-json';

export type AppInfo = R<{
  name: Str;
  scope: Str | Nul;
  version: Str;
}>

export function getAppInfo(): AppInfo {
  const packageJson = findPackageJson(__dirname).next().value ?? err('Cannot find package.json');
  const segments = packageJson.name!.split('/');
  return {
    version: packageJson.version!,
    name: segments.isSingle ? segments.single : segments[1]!,
    scope: segments.isSingle ? null : segments[0]!.stripStart('@'),
  };
}