import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirstNameAndLasName1767028105369 implements MigrationInterface {
    name = 'AddFirstNameAndLasName1767028105369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "first_name" character varying NOT NULL DEFAULT ''
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "last_name" character varying NOT NULL DEFAULT ''
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "last_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "first_name"
        `);
    }

}
