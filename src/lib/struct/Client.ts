import { clearAndWrite } from "#util";
import {
  Snowflake,
  UserResolvable,
  Client as _Client,
  ClientOptions as _ClientOptions
} from "discord.js";
import "dotenv/config";
import { CommandHandler, CommandHandlerOptions } from "./CommandHandler.js";

export interface ClientOptions {
  owners: Snowflake[];
  commandHandlerOptions: CommandHandlerOptions;
}

export class Client extends _Client {
  public owners: Snowflake[];
  public commandHandler: CommandHandler;

  constructor(options: ClientOptions, clientOpts: _ClientOptions) {
    super(clientOpts);
    this.owners = options.owners;
    this.commandHandler = new CommandHandler(this, options.commandHandlerOptions);

    this.commandHandler.addListener("commandLoadStart", (id: string) =>
      clearAndWrite("Loading command: " + id)
    );
    this.commandHandler.addListener("commandLoad", (id: string) =>
      clearAndWrite("Loaded command: " + id)
    );
    this.commandHandler.addListener("commandsLoaded", () => clearAndWrite("Loaded commands ✓\n"));
  }

  public async start() {
    if (!process.env.TOKEN) this.destroy();
    this.commandHandler.start();
    this.login(process.env.TOKEN);
  }

  public isOwner(user: UserResolvable): boolean {
    const id = this.users.resolveId(user) as Snowflake;
    return this.owners.includes(id ?? "");
  }
}
