import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDriverType1767101438820 implements MigrationInterface {
    name = 'AddDriverType1767101438820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."drivers_type_enum" AS ENUM('WHOLESALE', 'RETAIL')
        `);
        await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "type" "public"."drivers_type_enum" NOT NULL DEFAULT 'RETAIL'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "type"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."drivers_type_enum"
        `);
    }

}
