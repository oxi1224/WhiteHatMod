import { EventEmitter } from "events";
import { ClassConstructor } from "../../types.js";
import { Client } from "../Client.js";
import { Task } from "./Task.js";

export interface TaskHandlerOptions {
  taskPath: string;
  defaultInterval: number;
}

export class TaskHandler extends EventEmitter {
  private tasks: Task[] = [];
  public client: Client;
  public taskPath: string;
  public defaultInterval: number;

  constructor(client: Client, { taskPath, defaultInterval }: TaskHandlerOptions) {
    super();
    this.client = client;
    this.taskPath = taskPath;
    this.defaultInterval = defaultInterval;
  }

  public async start() {
    const imported: { [key: string]: ClassConstructor<Task> } = await import(this.taskPath);
    for (const constructor of Object.values(imported)) {
      const task = new constructor();
      if (this.tasks.map((t) => t.id).includes(task.id)) throw new Error("Task IDs must be unique");
      this.tasks.push(task);
      this.emit("taskLoad", task.id);
    }
    this.tasks.forEach((t) => setInterval(() => t.execute(), t.interval || this.defaultInterval));
    this.emit("loaded");
  }
}
