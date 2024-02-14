import "dotenv/config";
import { EventEmitter } from "events";
import { CustomClient } from "../CustomClient.js";
import type { ClassConstructor, ListenerHandlerOptions } from "../lib/types.js";
import { BaseListener } from "./Listener.js";

export class BaseListenerHandler extends EventEmitter {
  /**
   * Array of listeners to handle.
   */
  private listenerArray: BaseListener[] = [];

  /**
   * Path to the file containing exports of all classes.
   */
  private exportFileDirectory: string;

  /**
   * The client of the handler.
   */
  public client: CustomClient;

  /**
   * @param client - Client object.
   * @param options - Options.
   */
  constructor(client: CustomClient, { listenerExportFile }: ListenerHandlerOptions) {
    super();
    this.client = client;
    this.exportFileDirectory = listenerExportFile;
  }

  /**
   * Imports everything from exportFileDirectory, turns the listeners into classes and pushes them to listenerArray.
   */
  private async loadAll() {
    Object.entries(
      (await import(this.exportFileDirectory)) as { [key: string]: ClassConstructor<BaseListener> }
    )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(([key, command]) => {
        const listener = new command();
        if (this.listenerArray.find((l) => l.id === listener.id))
          throw new Error(`Listener IDs must be unique. (${listener.id})`);
        this.listenerArray.push(listener);
      });
  }

  /**
   * Starts the listeners.
   */
  public async start() {
    await this.loadAll();
    this.listenerArray.forEach((listener) => {
      if (listener.method === "once")
        listener.emitter.once(listener.event, (val: unknown) => listener.execute(val));
      else listener.emitter.on(listener.event, (val: unknown) => listener.execute(val));
      this.emit("listenerLoad", listener);
    });
  }
}
