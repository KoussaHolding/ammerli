import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverMatchingColumns1771059089067 implements MigrationInterface {
  name = 'AddDriverMatchingColumns1771059089067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "volume" double precision,
                "requiredVehicleType" character varying,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" character varying NOT NULL DEFAULT 'system',
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_by" character varying NOT NULL DEFAULT 'system',
                CONSTRAINT "PK_request_id" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "rating" double precision NOT NULL DEFAULT '5'
        `);
    await queryRunner.query(`
            ALTER TABLE "drivers"
            ADD "totalJobs" integer NOT NULL DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "totalJobs"
        `);
    await queryRunner.query(`
            ALTER TABLE "drivers" DROP COLUMN "rating"
        `);
    await queryRunner.query(`
            DROP TABLE "requests"
        `);
  }
}
