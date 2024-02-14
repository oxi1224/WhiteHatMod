import type { TaskOptions } from "../lib/types.js";
import { BaseTaskHandler } from "./TaskHandler.js";

export abstract class BaseTask {
  /**
   * Unique id of the task.
   */
  public id: string;

  /**
   * How often to run the command
   */
  public interval?: number;

  /**
   * The handler of the listener.
   */
  public taskHandler?: BaseTaskHandler;

  /**
   * @param id - Unique id of the task.
   * @param options - Options.
   */
  constructor(id: string, { interval }: TaskOptions) {
    this.id = id;
    this.interval = interval;
  }

  /**
   * The function to execute.
   */
  public execute() {
    throw new Error(`Execute function empty in task ${this.id}.`);
  }
}
