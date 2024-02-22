import { Client, TimeInMs } from "#lib";
import { GatewayIntentBits } from "discord.js";

export const client = new Client(
  {
    owners: ["344452070360875008", "162210610287869952"],
    commandHandlerOptions: {
      prefix: "!",
      flagPrefix: "--",
      commandPath: "../../../commands/index.js"
    },
    taskHandlerOptions: {
      taskPath: "../../../tasks/index.js",
      defaultInterval: TimeInMs.Minute
    }
  },
  {
    intents: Object.keys(GatewayIntentBits)
      .map((i) =>
        typeof i === "string" ? GatewayIntentBits[i as keyof typeof GatewayIntentBits] : i
      )
      .reduce((acc, p) => acc | p, 0)
  }
);

client.start();

// TODO Finish moderation commands
// TODO Automatic undoing punishments
// TODO ListenerHandler, Listeners
// TODO Action logging (punishment, delete, role change etc)
// TODO Embed responses
// TODO Guild specific configs in database
