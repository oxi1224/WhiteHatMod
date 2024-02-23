import { clearAndWrite } from "#util";
import {
  GuildResolvable,
  Snowflake,
  UserResolvable,
  Client as _Client,
  ClientOptions as _ClientOptions
} from "discord.js";
import "dotenv/config";
import { Sequelize } from "sequelize";
import { Punishment } from "../models/Punishment.js";
import * as moderation from "../moderation.js";
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
    this.commandHandler.on("commandLoadStart", (id: string) =>
      clearAndWrite("Loading command: " + id)
    );
    this.commandHandler.on("commandLoad", (id: string) => clearAndWrite("Loaded command: " + id));
    this.commandHandler.on("commandsLoaded", () => clearAndWrite("Loaded commands ✓\n"));

    this.taskHandler.on("taskLoad", (id: string) => clearAndWrite("Loaded task: " + id));
    this.taskHandler.on("loaded", () => clearAndWrite("Tasks loaded ✓\n"));
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

  // --------------------------------------------------------- //
  // This should be in a custom class extending Guild          //
  // but discord.js has marked it's constructor as private     //
  // so I'm putting this here as Command has access to Client  //
  // --------------------------------------------------------- //

  public async ban(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.ban(this, guild, options);
  }

  public async unban(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.unban(this, guild, options);
  }

  public async kick(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.kick(this, guild, options);
  }

  public async mute(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.mute(this, guild, options);
  }

  public async unmute(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.unmute(this, guild, options);
  }

  public async timeout(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.timeout(this, guild, options);
  }

  public async untimeout(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.untimeout(this, guild, options);
  }

  public async warn(guild: GuildResolvable, options: moderation.ModerationCommandOptions) {
    return await moderation.warn(this, guild, options);
  }
}
