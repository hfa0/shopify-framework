import { Bulk } from "../modules/bulk";
import { TaskManager} from "./task-manager";
import { ModuleName, ModuleMethod, IAppModule, AppModule } from "../modules";
import { unpackData } from "../middleware";

export enum SocketEvent {
  'CONNECT' = 'connect',
  'ERROR' = 'error',
  'MESSAGE' = 'MESSAGE'
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
  constructor(public readonly socket: any) {
  }
  public emit(event: SocketEvent | ModuleName, data: any) {
    this.socket.emit(event, JSON.stringify(data));
  }

  public addJob(method: ModuleMethod) {
    this.taskManager.addQueue(() => method(this));
  }
}


export class Worker {

  public readonly clients : {[name: string] : Client} = {};

  public readonly modules: ModuleMap = {
    [ModuleName.BULK] : Bulk
  }

  private handle(data: IncomingEventData, client: Client) {
    const method = this.modules[data.event].getMethod(data.job);
    if (!method) {
      return client.emit(SocketEvent.ERROR, "not found");
    }
    client.addJob(method);
  }

  private registerClientEvents(client: Client) {
    Object.keys(this.modules).map((moduleName: any) => 
      client.socket.on(moduleName, (dataString: string) => {
        console.log('receive', dataString);
        
        const [error, data] = unpackData(moduleName, dataString);
        if (error) {
          return client.emit(SocketEvent.ERROR, "invalid message data send");
        }
        this.handle(data, client);
      })
    );
    console.log(client.socket.eventNames());
  }

  public registerClient = (socket) => {
    console.log("server - register client");
    
    const client = new Client(socket);
    this.registerClientEvents(client);
    this.clients[socket.session.shop] = client;
  }
}