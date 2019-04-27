import { Bulk } from "../modules/bulk";
import { TaskManager} from "./task-manager";
import { ModuleName, ModuleMethod, IAppModule, AppModule } from "../modules";
import { unpackData } from "../middleware";
import { Socket } from 'socket.io';

export interface InternalSession {
  accessToken: string
  shop: string
}
export interface InternalSocket extends Socket {
  session: InternalSession
}

export enum SocketEvent {
  'CONNECT' = 'connect',
  'DISCONNECT' = 'disconnect',
  'ERROR' = 'error',
  'MESSAGE' = 'message',
  'INTERNAL_ERROR' = 'internal_error'
}

export const Events = {
  ...ModuleName,
  ...SocketEvent
}

export type ModuleMap = {[name in ModuleName]: IAppModule}


export interface IncomingEventData {
  event: ModuleName
  job: string
  data: any
} 

export class Client {
  private taskManager: TaskManager = new TaskManager();
  private lastMessage: IncomingEventData;

  constructor(public readonly socket: InternalSocket) {
  }

  public emit(event: SocketEvent | ModuleName, data: any) {
    this.socket.emit(event, JSON.stringify(data));
  }

  public addJob(method: ModuleMethod, data: IncomingEventData): void {
    this.taskManager.addQueue(() => method(this), data);
  }

  public setLastMessage(data: IncomingEventData): void {
    this.lastMessage = data;
  }

  public getLastMessage(): IncomingEventData {
    return this.lastMessage;
  }
}

export class Worker {

  public readonly clients : Map<string, Client>  = new Map();

  public readonly modules: ModuleMap = {
    [ModuleName.BULK] : Bulk
  }

  private handle(data: IncomingEventData, client: Client) {
    const method = this.modules[data.event].getMethod(data);
    if (!method) {
      return client.emit(SocketEvent.INTERNAL_ERROR, "not found");
    }
    client.addJob(method, data);
  }

  private registerClientEvents(client: Client) {
    Object.keys(this.modules).map((moduleName: any) => 
      client.socket.on(moduleName, (dataString: string) => {
        console.log('server', 'receive', dataString);
        
        const [error, data] = unpackData(moduleName, dataString);
        if (error) {
          return client.emit(SocketEvent.INTERNAL_ERROR, "invalid message data send");
        }
        client.setLastMessage(data);
        this.handle(data, client);
      })
    );
    client.socket.on(SocketEvent.DISCONNECT, (err: string) => {
      console.log('server', 'client disconected', client.socket.id, err);
      this.unregisterClient(client);
    })
    client.socket.on(SocketEvent.ERROR, (err: string) => {
      console.log('server", "client error', client.socket.id, err);
    })
    console.log('server', 'client registered events', client.socket.eventNames());
  }

  public registerClient = (socket: InternalSocket) => {
    console.log("server", "register client", socket.id);
    const client = new Client(socket);
    this.clients.set(socket.id, client);
    this.registerClientEvents(client);
  }

  private unregisterClient(client: Client) {
    const id = client.socket.id;
    console.log("server", "unregister client", id);
    if (!client.socket.disconnected) {
      console.log("server", "disconnect client first and retry", id);
      return client.socket.disconnect(true);
    }
    client.socket.removeAllListeners();
    this.clients.delete(id);
  }
}