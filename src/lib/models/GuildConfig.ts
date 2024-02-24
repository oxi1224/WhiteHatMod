import { Snowflake } from "discord.js";
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize";

export class GuildConfig extends Model<
  InferAttributes<GuildConfig>,
  InferCreationAttributes<GuildConfig>
> {
  declare id: Snowflake;
  declare prefix: CreationOptional<string>;
  declare logChannel: CreationOptional<Snowflake | null>;
  declare mutedRole: CreationOptional<Snowflake | null>;

  public static initialize(sequelize: Sequelize) {
    GuildConfig.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        prefix: { type: DataTypes.STRING, allowNull: true, defaultValue: "!" },
        logChannel: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        mutedRole: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
      },
      { sequelize }
    );
  }
}
