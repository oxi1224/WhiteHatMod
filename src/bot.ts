import { Client } from "#lib";
import { GatewayIntentBits } from "discord.js";

export const client = new Client(
  {
    owners: ["344452070360875008", "162210610287869952"],
    commandHandlerOptions: {
      prefix: "!",
      flagPrefix: "--",
      commandPath: "../../commands/index.js"
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
