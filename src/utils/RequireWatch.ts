/* eslint-disable @typescript-eslint/no-var-requires */
import { type FSWatcher, watch } from 'fs';
import Module from 'node:module';

const require = Module.createRequire(import.meta.url);

export class RequireWatch {
  public readonly path: string;
  public readonly data: any;

  public readonly watcher: FSWatcher;

  public constructor (path: string) {
    this.path = require.resolve(path);

    const _data = require(path);
    this.data = _data;

    this.watcher = watch(this.path, { persistent: false });

    this.watcher.on('change', this.boundUpdate);
  }

  public update (): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete require.cache[this.path];
    const newData = require(this.path);
    Object.assign(this.data, newData);
  }

  public readonly boundUpdate = this.update.bind(this);

  public [Symbol.dispose] (): void {
    this.watcher.close();
    this.watcher.removeAllListeners();
  }
}

export class RequireParseWatch<T extends Record<any, any>> {
  public readonly path: string;
  public readonly data: T;
  public readonly parser: (data: any) => T;

  public readonly watcher: FSWatcher;

  public constructor (path: string, parser: (data: any) => T) {
    this.path = require.resolve(path);
    this.parser = parser;

    const _data = require(path);
    this.data = this.parse(_data);

    this.watcher = watch(this.path, { persistent: false });

    this.watcher.on('change', this.boundUpdate);
  }

  protected parse (data: any): T {
    return this.parser(data);
  }

  public update (): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete require.cache[this.path];
    const newData = this.parse(require(this.path));
    Object.assign(this.data, newData);
  }

  public readonly boundUpdate = this.update.bind(this);

  public [Symbol.dispose] (): void {
    this.watcher.close();
    this.watcher.removeAllListeners();
  }
}
