import { clearAndWrite } from "#util";
import {
  Snowflake,
  UserResolvable,
  Client as _Client,
  ClientOptions as _ClientOptions
} from "discord.js";
import "dotenv/config";
import { Sequelize } from "sequelize";
import { Punishment } from "../models/Punishment.js";
import { CommandHandler, CommandHandlerOptions } from "./command/CommandHandler.js";
import { TaskHandler, TaskHandlerOptions } from "./task/TaskHandler.js";

export interface ClientOptions {
  owners: Snowflake[];
  commandHandlerOptions: CommandHandlerOptions;
  taskHandlerOptions: TaskHandlerOptions;
}

export class Client extends _Client {
  public owners: Snowflake[];
  public env: "prod" | "dev";
  public db: Sequelize;
  public commandHandler: CommandHandler;
  public taskHandler: TaskHandler;

  constructor(options: ClientOptions, djsClientOpts: _ClientOptions) {
    super(djsClientOpts);
    this.owners = options.owners;
    this.env = (process.argv.at(2) as "prod" | "dev") || "dev";
    const url = this.env == "dev" ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL;
    this.db = new Sequelize(url || "", {
      dialect: "postgres",
      logging: false,
      define: { timestamps: false }
    });
    this.commandHandler = new CommandHandler(this, options.commandHandlerOptions);
    this.taskHandler = new TaskHandler(this, options.taskHandlerOptions);

    // TODO: implement a util logger class to handle things like this:
    this.commandHandler.addListener("commandLoadStart", (id: string) =>
      clearAndWrite("Loading command: " + id)
    );
    this.commandHandler.addListener("commandLoad", (id: string) =>
      clearAndWrite("Loaded command: " + id)
    );
    this.commandHandler.addListener("commandsLoaded", () => clearAndWrite("Loaded commands ✓\n"));

    this.taskHandler.addListener("taskLoad", (id: string) => clearAndWrite("Loaded task: " + id));
    this.taskHandler.addListener("loaded", () => clearAndWrite("Tasks loaded ✓\n"));
  }

  private async initDb() {
    clearAndWrite("Authenticating database");
    await this.db.authenticate();
    clearAndWrite("Initializing models");
    Punishment.initialize(this.db);
    clearAndWrite("Syncing database");
    await this.db.sync({ alter: true });
    clearAndWrite("Database setup finished ✓\n");
  }

  public async start() {
    if (!process.env.TOKEN) this.destroy();
    await this.initDb();
    await this.commandHandler.start();
    await this.taskHandler.start();
    this.login(process.env.TOKEN);
  }

  public isOwner(user: UserResolvable): boolean {
    const id = this.users.resolveId(user) as Snowflake;
    return this.owners.includes(id ?? "");
  }
}
