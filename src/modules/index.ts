import { Client, IncomingEventData } from "../worker";

export enum ModuleName {
  'BULK' = 'bulk',
}

export type ModuleMethod = (client: Client, data: IncomingEventData) => void

export interface IAppModule {
  getMethod: (data: IncomingEventData) => ModuleMethod
}

export abstract class AppModule {
  public static getMethod(data: IncomingEventData): ModuleMethod {
    const method = this[data.job];
    if (!method || typeof method !== 'function') {
      return null;
    }
    return method;
  }
}