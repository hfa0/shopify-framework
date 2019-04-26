import { Bulk } from "../modules/bulk";
import { TaskManager} from "./task-manager";
import { ModuleName, ModuleMethod, IAppModule } from "../modules";

export enum SocketEvent {
  'CONNECT' = 'connect',
  'ERROR' = 'error',
  'MESSAGE' = 'MESSAGE'
}

export const Events = {
  ...ModuleName,
  ...SocketEvent
}


export class Client {
  private taskManager: TaskManager = new TaskManager();
  constructor(private socket: any) {
  }
  public emit(event: SocketEvent | ModuleName, data: any) {
    this.socket.emit(event, JSON.stringify(data));
  }

  public addJob(method: ModuleMethod) {
    this.taskManager.addQueue(() => method(this));
  }
}

export class Worker {

  private clients : {[name: string] : Client} = {};

  public readonly modules: {[name in ModuleName]: IAppModule} = {
    [ModuleName.BULK] : Bulk
  }

  public handle(module: ModuleName, socket) {
    const client = this.clients[socket.session.shop];
    if (!client) {
      new Client(socket).emit(SocketEvent.ERROR, "not registered");
    }
    const method = this.modules[module].getMethod(socket.data.job);
    if (!method) {
      client.emit(SocketEvent.ERROR, "not found");
    }
    client.addJob(method);
  }

  public registerClient(socket) {
    this.clients[socket.session.shop] = new Client(socket);
  }
}