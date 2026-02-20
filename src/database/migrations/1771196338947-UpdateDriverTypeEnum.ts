import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDriverTypeEnum1771196338947 implements MigrationInterface {
    name = 'UpdateDriverTypeEnum1771196338947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."drivers_type_enum" RENAME TO "drivers_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."drivers_type_enum" AS ENUM('MOTORCYCLE', 'CAR', 'TRUCK')`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" TYPE "public"."drivers_type_enum" USING "type"::"text"::"public"."drivers_type_enum"`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" SET DEFAULT 'MOTORCYCLE'`);
        await queryRunner.query(`DROP TYPE "public"."drivers_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."drivers_type_enum_old" AS ENUM('WHOLESALE', 'RETAIL')`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" TYPE "public"."drivers_type_enum_old" USING "type"::"text"::"public"."drivers_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "drivers" ALTER COLUMN "type" SET DEFAULT 'RETAIL'`);
        await queryRunner.query(`DROP TYPE "public"."drivers_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."drivers_type_enum_old" RENAME TO "drivers_type_enum"`);
    }

}
