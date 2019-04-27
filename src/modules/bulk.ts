import { Client, IncomingEventData } from "../worker";
import { IAppModule, AppModule, ModuleMethod, ModuleName } from ".";



export class Bulk extends AppModule  {

  public static upload: ModuleMethod = (client: Client): void => {
    // console.log(client.socket.message)
    client.emit(ModuleName.BULK, "hello");
  }

}