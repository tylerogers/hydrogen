import {join} from 'path';

import {readJsonSync, writeFileSync} from 'fs-extra';

interface PackageBase {
  name?: string;
  engines?: {node?: string};
}

interface PackageJson extends PackageBase {
  dependencies: {[key: string]: string};
  devDependencies: {[key: string]: string};
}

interface PackageInternal extends PackageBase {
  dependencies?: Map<string, string>;
  devDependencies?: Map<string, string>;
}

export interface DependencyOptions {
  all?: boolean;
  dev?: boolean;
  prod?: boolean;
}

interface InstallOptions {
  dev?: boolean;
  version?: string;
}

export class Package {
  private readonly internal: PackageInternal;

  constructor(private _root: string = process.cwd()) {
    this.internal = {};

    try {
      const pkgJson: PackageJson = readJsonSync(
        join(this._root, 'package.json')
      );

      if (pkgJson) {
        const {dependencies, devDependencies, ...rest} = pkgJson;
        const _dependencies = Object.entries(dependencies ?? {});
        const _devDependencies = Object.entries(devDependencies ?? {});

        this.internal = rest;
        this.internal.dependencies = new Map(_dependencies);
        this.internal.devDependencies = new Map(_devDependencies);
      }
    } catch (error) {}
  }

  get name() {
    return this.internal?.name;
  }

  set root(val: string) {
    this._root = val;
    try {
      const pkgJson: PackageJson = readJsonSync(join(val, 'package.json'));

      if (pkgJson) {
        const dependencies = Object.entries(pkgJson.dependencies ?? {});
        const devDependencies = Object.entries(pkgJson.devDependencies ?? {});

        this.internal.name = pkgJson.name;
        this.internal.engines = pkgJson.engines;
        this.internal.dependencies = new Map(dependencies);
        this.internal.devDependencies = new Map(devDependencies);
      }
    } catch (error) {}
  }

  write() {
    const pkgJson: PackageJson = {
      name: this.internal.name,
      engines: this.internal.engines,
      dependencies: {},
      devDependencies: {},
    };

    this.internal.dependencies?.forEach((version, name) => {
      pkgJson.dependencies[name] = version;
    });

    this.internal.devDependencies?.forEach((version, name) => {
      pkgJson.devDependencies[name] = version;
    });

    writeFileSync(
      join(this._root, 'package.json'),
      JSON.stringify(pkgJson, null, 2)
    );
  }

  install(dependency: string, options: InstallOptions = {}) {
    if (options.dev) {
      this.internal.devDependencies?.set(
        dependency,
        options.version || 'latest'
      );
      return;
    }
    this.internal.dependencies?.set(dependency, options.version || 'latest');
  }

  async hasDependency(name: string): Promise<boolean> {
    return Boolean(
      this.internal.dependencies?.has(name) ||
        this.internal.devDependencies?.has(name)
    );
  }

  async nodeVersion() {
    return this.internal.engines?.node;
  }
}
