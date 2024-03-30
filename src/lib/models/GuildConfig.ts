import { Snowflake } from "discord.js";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export class GuildConfig extends Model<
  InferAttributes<GuildConfig>,
  InferCreationAttributes<GuildConfig>
> {
  declare id: Snowflake;
  declare prefix: CreationOptional<string>;
  declare moderationLogChannel: CreationOptional<Snowflake | null>;
  declare messageLogChannel: CreationOptional<Snowflake | null>;
  declare otherLogChannel: CreationOptional<Snowflake | null>;
  declare mutedRole: CreationOptional<Snowflake | null>;
  declare joinRoles: CreationOptional<Snowflake[]>;
  declare commandChannels: CreationOptional<Snowflake[]>;
  declare lockdownChannels: CreationOptional<Snowflake[]>;
  declare automodImmune: CreationOptional<Snowflake[]>;
  declare infractionThreshold: CreationOptional<number>;

  public static initialize(sequelize: Sequelize) {
    GuildConfig.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        prefix: { type: DataTypes.STRING, allowNull: true, defaultValue: "!" },
        moderationLogChannel: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        messageLogChannel: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        otherLogChannel: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        mutedRole: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        joinRoles: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        commandChannels: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        lockdownChannels: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        automodImmune: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        infractionThreshold: { type: DataTypes.INTEGER, defaultValue: 4 }
      },
      { sequelize }
    );
  }
}

const _keys = GuildConfig.getAttributes();

// key : accept_type
export const guildConfigKeys: { [key in keyof Omit<typeof _keys, "id">]: string } = {
  prefix: "string",
  moderationLogChannel: "channel",
  messageLogChannel: "channel",
  otherLogChannel: "channel",
  mutedRole: "role",
  joinRoles: "role",
  commandChannels: "channel",
  lockdownChannels: "channel",
  automodImmune: "role",
  infractionThreshold: "int"
} as const;
export const arrayTypeKeys = ["joinRoles", "commandChannels", "lockdownChannels", "automodImmune"];
export type GuildConfigKeys = keyof typeof guildConfigKeys;
