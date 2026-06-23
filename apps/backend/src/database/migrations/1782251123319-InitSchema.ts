import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1782251123319 implements MigrationInterface {
    name = 'InitSchema1782251123319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wilayas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "UQ_32052c4ea95aa7ae74b41a761f6" UNIQUE ("code"), CONSTRAINT "PK_wilaya_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_wilaya_code" ON "wilayas" ("code") `);
        await queryRunner.query(`CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" character varying(255) NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_session_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('CLIENT', 'DRIVER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL DEFAULT '', "last_name" character varying NOT NULL DEFAULT '', "phone" character varying NOT NULL, "email" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CLIENT', "password" character varying NOT NULL, "bio" character varying NOT NULL DEFAULT '', "image" character varying NOT NULL DEFAULT '', "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_user_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_phone" ON "users" ("phone") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_email" ON "users" ("email") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."drivers_type_enum" AS ENUM('BOTTLED', 'TANKER')`);
        await queryRunner.query(`CREATE TABLE "drivers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."drivers_type_enum" NOT NULL DEFAULT 'BOTTLED', "rating" double precision NOT NULL DEFAULT '5', "totalJobs" integer NOT NULL DEFAULT '0', "truckPlate" character varying, "capacity" integer, "waterType" character varying, "walletBalance" numeric(10,2) NOT NULL DEFAULT '0', "totalEarnings" numeric(10,2) NOT NULL DEFAULT '0', "inventory" json, "user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "REL_8e224f1b8f05ace7cfc7c76d03" UNIQUE ("user_id"), CONSTRAINT "PK_driver_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."requests_status_enum" AS ENUM('PENDING', 'SEARCHING', 'DISPATCHED', 'ACCEPTED', 'ARRIVED', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'SCHEDULED')`);
        await queryRunner.query(`CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "volume" double precision, "requiredVehicleType" character varying, "status" "public"."requests_status_enum" NOT NULL DEFAULT 'SEARCHING', "userId" uuid NOT NULL, "pickupLat" double precision, "pickupLng" double precision, "deliveryAddress" character varying, "type" character varying, "tankerDetails" json, "bottledItems" json, "isScheduled" boolean NOT NULL DEFAULT false, "scheduledDate" character varying, "scheduledTime" character varying, "subtotal" numeric(10,2), "deliveryFee" numeric(10,2), "totalPrice" numeric(10,2), "cancelReason" character varying, "productId" uuid, "driverId" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_request_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "comment" text, "reviewerId" uuid NOT NULL, "targetId" uuid NOT NULL, "requestId" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "REL_6031885aa022434a6fda1d8204" UNIQUE ("requestId"), CONSTRAINT "PK_rating_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "capacity_liters" integer NOT NULL, "base_price" numeric(10,2) NOT NULL, "price_per_km" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "UQ_4c9fb58de893725258746385e16" UNIQUE ("name"), CONSTRAINT "PK_product_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pricing_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "wilayaId" uuid NOT NULL, "price_override" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_pricing_rule_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_product_wilaya_pricing" ON "pricing_rules" ("productId", "wilayaId") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('CREATED', 'PICKED_UP', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestId" uuid NOT NULL, "userId" uuid NOT NULL, "driverId" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'CREATED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "userType" character varying, "token" character varying NOT NULL, "platform" character varying NOT NULL DEFAULT 'mobile', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "PK_device_token_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying NOT NULL DEFAULT 'system', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying NOT NULL DEFAULT 'system', CONSTRAINT "REL_7fbf0ccdd3214a8af926829216" UNIQUE ("user_id"), CONSTRAINT "PK_Client_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drivers" ADD CONSTRAINT "FK_8e224f1b8f05ace7cfc7c76d03b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_be846ad4b43f40acc7034ef7f40" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_f80169fce8fd99bca1d26e3a8ed" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_b7240150ac0e06ea1f1b6825130" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_64d6d3099b73aee4307b0044b8d" FOREIGN KEY ("targetId") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratings" ADD CONSTRAINT "FK_6031885aa022434a6fda1d8204e" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" ADD CONSTRAINT "FK_ffc0c09880090e2d0b3e2bf897c" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" ADD CONSTRAINT "FK_89d8741b995e12f9f8f1edf1867" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Clients" ADD CONSTRAINT "FK_7fbf0ccdd3214a8af9268292162" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Clients" DROP CONSTRAINT "FK_7fbf0ccdd3214a8af9268292162"`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" DROP CONSTRAINT "FK_89d8741b995e12f9f8f1edf1867"`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" DROP CONSTRAINT "FK_ffc0c09880090e2d0b3e2bf897c"`);
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_6031885aa022434a6fda1d8204e"`);
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_64d6d3099b73aee4307b0044b8d"`);
        await queryRunner.query(`ALTER TABLE "ratings" DROP CONSTRAINT "FK_b7240150ac0e06ea1f1b6825130"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_f80169fce8fd99bca1d26e3a8ed"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_be846ad4b43f40acc7034ef7f40"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_8e224f1b8f05ace7cfc7c76d03b"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_session_user"`);
        await queryRunner.query(`DROP TABLE "Clients"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_product_wilaya_pricing"`);
        await queryRunner.query(`DROP TABLE "pricing_rules"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "ratings"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TYPE "public"."requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "drivers"`);
        await queryRunner.query(`DROP TYPE "public"."drivers_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_email"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_phone"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_wilaya_code"`);
        await queryRunner.query(`DROP TABLE "wilayas"`);
    }

}
