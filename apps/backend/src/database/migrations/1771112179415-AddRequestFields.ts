import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestFields1771112179415 implements MigrationInterface {
  name = 'AddRequestFields1771112179415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "pickupLat" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "pickupLng" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "requests" ADD "productId" uuid`);
    await queryRunner.query(
      `ALTER TYPE "public"."requests_status_enum" RENAME TO "requests_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."requests_status_enum" AS ENUM('SEARCHING', 'DISPATCHED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" TYPE "public"."requests_status_enum" USING "status"::"text"::"public"."requests_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'SEARCHING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."requests_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."requests_status_enum_old" AS ENUM('SEARCHING', 'DISPATCHED', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" TYPE "public"."requests_status_enum_old" USING "status"::"text"::"public"."requests_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ALTER COLUMN "status" SET DEFAULT 'SEARCHING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."requests_status_enum_old" RENAME TO "requests_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "productId"`);
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "pickupLng"`);
    await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "pickupLat"`);
  }
}
