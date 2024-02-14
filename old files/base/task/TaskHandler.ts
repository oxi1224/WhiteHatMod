import { EventEmitter } from "events";
import { CustomClient } from "../CustomClient.js";
import { TimeInMs } from "../lib/constants.js";
import type { ClassConstructor, TaskHandlerOptions } from "../lib/types.js";
import { BaseTask } from "./Task.js";

export class BaseTaskHandler extends EventEmitter {
  /**
   * Array of tasks to handle.
   */
  private taskArray: BaseTask[] = [];

  /**
   * The client of the handler.
   */
  public client: CustomClient;

  /**
   * Path to the file containing exports of all classes.
   */
  public exportFileDirectory: string;

  /**
   * The default interval of the tasks.
   */
  public defaultInterval: number;

  /**
   *
   * @param client - Client object.
   * @param options - Options.
   */
  constructor(
    client: CustomClient,
    { taskExportFile, defaultInterval = TimeInMs.Minute * 1 }: TaskHandlerOptions
  ) {
    super();
    this.client = client;
    this.exportFileDirectory = taskExportFile;
    this.defaultInterval = defaultInterval;
  }

  /**
   * Imports everything from exportFileDirectory, turns the tasks into classes and pushes them to taskArray.
   */
  private async loadAll() {
    Object.entries(
      (await import(this.exportFileDirectory)) as { [key: string]: ClassConstructor<BaseTask> }
    )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(([key, task]) => {
        const currentTask = new task();
        if (this.taskArray.find((t) => t.id === currentTask.id))
          throw new Error(`Task IDs must be unique. (${currentTask.id})`);
        this.taskArray.push(currentTask);
        this.emit("taskLoad", currentTask);
      });
  }

  /**
   * Sets the intervals of each task.
   */
  public async start() {
    await this.loadAll();
    this.taskArray.forEach((task) =>
      setInterval(() => task.execute(), task.interval ?? this.defaultInterval)
    );
  }
}
