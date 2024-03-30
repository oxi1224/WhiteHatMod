import { Snowflake } from "discord.js";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize
} from "sequelize";

export type PunishmentType =
  | "MUTE"
  | "BAN"
  | "WARN"
  | "KICK"
  | "UNBAN"
  | "UNMUTE"
  | "PURGE"
  | "INFRACTION"
  | "INFRACTION-REMOVE";

export class Punishment extends Model<
  InferAttributes<Punishment>,
  InferCreationAttributes<Punishment>
> {
  declare id: CreationOptional<number>;
  declare type: PunishmentType;
  declare reason: CreationOptional<string>;
  declare duration: CreationOptional<number | null>;
  declare guildID: Snowflake;
  declare victimID: Snowflake;
  declare modID: Snowflake;
  declare handled: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;

  public static initialize(sequelize: Sequelize) {
    Punishment.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: DataTypes.STRING, allowNull: false },
        duration: { type: DataTypes.BIGINT, allowNull: true, defaultValue: null },
        reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: "N/A" },
        guildID: { type: DataTypes.TEXT, allowNull: false },
        victimID: { type: DataTypes.TEXT, allowNull: false },
        modID: { type: DataTypes.TEXT, allowNull: false },
        handled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        createdAt: { type: DataTypes.DATE }
      },
      { sequelize }
    );
  }
}
