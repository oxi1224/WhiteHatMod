import { ClassConstructor } from "#src/lib/types.js";
import { EventEmitter } from "events";
import { Client } from "../Client.js";
import { Listener } from "./Listener.js";

export interface ListenerHandlerOptions {
  listenerPath: string;
}

export class ListenerHandler extends EventEmitter {
  private listenersArr: Listener[] = [];
  public client: Client;
  public listenerPath: string;

  constructor(client: Client, { listenerPath }: ListenerHandlerOptions) {
    super();
    this.client = client;
    this.listenerPath = listenerPath;
  }

  public async start() {
    const imported: { [key: string]: ClassConstructor<Listener> } = await import(this.listenerPath);
    for (const constructor of Object.values(imported)) {
      const listener = new constructor();
      if (this.listenersArr.map((l) => l.id).includes(listener.id))
        throw new Error("Listener IDs must be unique");
      this.listenersArr.push(listener);
      this.emit("listenerLoad", listener.id);
    }
    this.listenersArr.forEach((l) => l.emitter.on(l.event, (...data: any) => l.execute(...data)));
    this.emit("loaded");
  }
}
