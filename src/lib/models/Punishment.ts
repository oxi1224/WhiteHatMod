import { Snowflake } from "discord.js";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize";

export type PunishmentType = "MUTE" | "BAN" | "WARN" | "KICK" | "UNBAN" | "UNMUTE" | "PURGE";

export class Punishment extends Model<
  InferAttributes<Punishment>,
  InferCreationAttributes<Punishment>
> {
  declare id: number;
  declare type: PunishmentType;
  declare reason: string;
  declare duration: number;
  declare guildID: Snowflake;
  declare victimID: Snowflake;
  declare modID: Snowflake;
  declare date: Date;

  public static initialize(sequelize: Sequelize) {
    Punishment.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: DataTypes.STRING, allowNull: false },
        duration: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
        reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: "N/A" },
        guildID: { type: DataTypes.TEXT, allowNull: false },
        victimID: { type: DataTypes.TEXT, allowNull: false },
        modID: { type: DataTypes.TEXT, allowNull: false },
        date: { type: DataTypes.DATE, allowNull: true, defaultValue: new Date() }
      },
      { sequelize }
    );
  }
}
