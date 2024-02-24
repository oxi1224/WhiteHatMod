import { EventEmitter } from "events";
import { client } from "#src/bot.js";
import { Client as ClientClass } from "../Client.js";

export interface ListenerOptions {
  emitter: EventEmitter;
  event: string;
}

export class Listener {
  /** Unique ID of listener */
  public id: string;

  /** The emitter of the event */
  public emitter: EventEmitter;

  /** The event */
  public event: string;

  /** Initialized client */
  public client: ClientClass = client;
  
  constructor(id: string, { emitter, event }: ListenerOptions) {
    this.id = id;
    this.emitter = emitter;
    this.event = event;
  }

  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(...data: any): void {
    throw new Error("execute() not overriden in task:" + this.id);
  }
}