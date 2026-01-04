import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClient1767098747005 implements MigrationInterface {
    name = 'CreateClient1767098747005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Clients" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL DEFAULT 'system',
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL DEFAULT 'system',
                CONSTRAINT "REL_7fbf0ccdd3214a8af926829216" UNIQUE ("user_id"),
                CONSTRAINT "PK_Client_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "Clients"
            ADD CONSTRAINT "FK_7fbf0ccdd3214a8af9268292162" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "Clients" DROP CONSTRAINT "FK_7fbf0ccdd3214a8af9268292162"
        `);
        await queryRunner.query(`
            DROP TABLE "Clients"
        `);
    }

}
