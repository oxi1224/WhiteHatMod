export abstract class Task {
  public id: string;
  public interval?: number;

  constructor(id: string, interval?: number) {
    this.id = id;
    this.interval = interval;
  }

  public execute(): void {
    throw new Error("exec() not overriden in task: " + this.id);
  }
}
