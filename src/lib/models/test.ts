import { DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from "sequelize";

export class Test extends Model<InferAttributes<Test>, InferCreationAttributes<Test>> {
  declare id: number;

  async initialize(sequelize: Sequelize) {
    Test.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
      },
      { sequelize }
    );
  }
}
