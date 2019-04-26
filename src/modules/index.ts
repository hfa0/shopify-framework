import { Client } from "../worker";

export enum ModuleName {
  'BULK' = 'bulk',
}

export type ModuleMethod = (client: Client) => void

export interface IAppModule {
  getMethod: (job: string) => ModuleMethod
}

export abstract class AppModule {
  public static getMethod(job: string): ModuleMethod {
    const method = this[job];
    if (!method || typeof method !== 'function') {
      return null;
    }
    return method;
  }
}