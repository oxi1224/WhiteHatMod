import { CommandInteraction, InteractionReplyOptions, InteractionType, Message } from "discord.js";

type InteractionResponse = InteractionReplyOptions;

// TODO - (?) Maybe implement
export class ActionMessage {
  public msg?: Message;
  public interaction?: CommandInteraction;

  constructor(inter: Message | CommandInteraction) {
    if (inter.type == InteractionType.ApplicationCommand) {
      this.interaction = inter;
    } else {
      this.msg = inter;
    }
  }

  public async reply(message: string, opts: InteractionResponse) {
    if (this.interaction) {
      if (!opts) throw new Error("Options must be defined when replying to interaction");
      opts.content = message;
      return await this.interaction.reply(opts);
    }
    return await this.msg!.reply("message");
  }

  public content() {
    if (this.interaction) return "";
    return this.msg?.content;
  }
}
