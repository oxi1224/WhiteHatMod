import {
  CommandInteraction,
  InteractionDeferReplyOptions,
  InteractionReplyOptions,
  InteractionType,
  Message,
  MessagePayload,
  MessageReplyOptions
} from "discord.js";

type MessageResponseOptions = MessageReplyOptions | MessagePayload | string;
type InteractionResponseOptions = InteractionReplyOptions | MessagePayload | string;

type ReplyOptions = MessageResponseOptions | InteractionResponseOptions;

/**
 * This is basically a wrapper, not the best but i cannot extends Message or CommandInteraction
 * due to their constructors being private, if this class doesnt provide something directly
 * just use ActionMessage.msg or ActionMessage.interaction
 */

export class ActionMessage {
  public msg?: Message;
  public interaction?: CommandInteraction;
  private interactionDeffered = false;

  constructor(interaction: Message | CommandInteraction) {
    if (interaction.type == InteractionType.ApplicationCommand) {
      this.interaction = interaction;
    } else {
      this.msg = interaction;
    }
  }

  public async reply(options: ReplyOptions) {
    if (this.interaction) {
      if (!options) throw new Error("Options must be defined when replying to interaction");
      if (this.interactionDeffered) {
        return await this.interaction.editReply(options);
      } else {
        return await this.interaction.reply(options as InteractionResponseOptions);
      }
    }
    return await this.msg!.reply(options as MessageResponseOptions);
  }

  public async deferReply(options?: InteractionDeferReplyOptions | undefined) {
    if (this.interaction) {
      await this.interaction.deferReply(options);
      this.interactionDeffered = true;
    }
  }

  public get content() {
    return this.interaction ? null : this.msg!.content;
  }

  public get guild() {
    return this.interaction ? this.interaction.guild : this.msg!.guild;
  }

  public get member() {
    return this.interaction ? this.interaction.member : this.msg!.member;
  }

  public get channel() {
    return this.interaction ? this.interaction.channel : this.msg!.channel;
  }

  public get channelId() {
    return this.interaction ? this.interaction.channelId : this.msg!.channelId;
  }

  public get author() {
    return this.interaction ? null : this.msg!.author;
  }

  public get client() {
    return this.interaction ? this.interaction.client : this.msg!.client;
  }

  public get createdTimestamp() {
    return this.interaction ? this.interaction.createdTimestamp : this.msg!.createdTimestamp;
  }

  public get id() {
    return this.interaction ? this.interaction.id : this.msg!.id;
  }

  public inGuild() {
    return this.interaction ? this.interaction.inGuild() : this.msg!.inGuild();
  }
}
