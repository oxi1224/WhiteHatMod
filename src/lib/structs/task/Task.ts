import { client } from "#src/bot.js";
import { Client as ClientClass } from "../Client.js";

export abstract class Task {
  /** Unique ID of task */
  public id: string;

  /** Interval at which to run execeute */
  public interval?: number;

  /** Initialized client */
  public client: ClientClass = client;
  
  constructor(id: string, interval?: number) {
    this.id = id;
    this.interval = interval;
  }

  public execute(): void {
    throw new Error("exec() not overriden in task: " + this.id);
  }
}
