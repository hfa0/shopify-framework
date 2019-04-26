import { Bulk } from "../modules/bulk";
import { TaskManager} from "./task-manager";
import { ModuleName, ModuleMethod, IAppModule, AppModule } from "../modules";
import { unpackData } from "../middleware";

export enum SocketEvent {
  'CONNECT' = 'connect',
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

  constructor(public readonly socket: any) {
  }
  public emit(event: SocketEvent | ModuleName, data: any) {
    this.socket.emit(event, JSON.stringify(data));
  }

  public addJob(method: ModuleMethod, job: string) {
    this.taskManager.addQueue(() => method(this, this.lastMessage), job);
  }

  public setLastMessage(data: IncomingEventData) {
    this.lastMessage = data;
  }
}

export class Worker {

  public readonly clients : {[name: string] : Client} = {};

  public readonly modules: ModuleMap = {
    [ModuleName.BULK] : Bulk
  }

  private handle(data: IncomingEventData, client: Client) {
    const method = this.modules[data.event].getMethod(data);
    if (!method) {
      return client.emit(SocketEvent.INTERNAL_ERROR, "not found");
    }
    client.addJob(method, data.job);
  }

  private registerClientEvents(client: Client) {
    Object.keys(this.modules).map((moduleName: any) => 
      client.socket.on(moduleName, (dataString: string) => {
        console.log('server", "receive', dataString);
        
        const [error, data] = unpackData(moduleName, dataString);
        if (error) {
          return client.emit(SocketEvent.INTERNAL_ERROR, "invalid message data send");
        }
        client.setLastMessage(data);
        this.handle(data, client);
      })
    );
    client.socket.on(SocketEvent.ERROR, (err) => {
      console.log('server", "client error', client.socket.session.shop, err);
    })
    console.log('server', 'registered events', client.socket.eventNames());
  }

  public registerClient = (socket) => {
    console.log("server", "register client", socket.session.shop);
    
    const client = new Client(socket);
    this.registerClientEvents(client);
    this.clients[socket.session.shop] = client;
  }
}