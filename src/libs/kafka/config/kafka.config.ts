// kafka.config.ts
import validateConfig from '@/utils/validate-config';
import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { KafkaConfig } from './kafka-config.type';

class KafkaEnvValidator {
  @IsString()
  @IsNotEmpty()
  KAFKA_BROKERS: string;

  @IsString()
  @IsNotEmpty()
  KAFKA_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  KAFKA_USERNAME: string;

  @IsString()
  @IsOptional()
  KAFKA_PASSWORD: string;

  @IsString()
  @IsOptional()
  KAFKA_CA_PATH: string;

  @IsBoolean()
  @IsOptional()
  KAFKA_SSL_ENABLED: boolean;

  @IsBoolean()
  @IsOptional()
  KAFKA_SASL_ENABLED: boolean;

  @IsString()
  @IsNotEmpty()
  KAFKA_CONSUMER_GROUP_ID: string;
}

export default registerAs<KafkaConfig>('kafka', () => {
  console.info('Register KafkaConfig from environment variables');
  validateConfig(process.env, KafkaEnvValidator);

  return {
    brokers: process.env.KAFKA_BROKERS.split(','),
    clientId: process.env.KAFKA_CLIENT_ID,
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
    caPath: process.env.KAFKA_CA_PATH,
    sslEnabled: process.env.KAFKA_SSL_ENABLED === 'true',
    saslEnabled: process.env.KAFKA_SASL_ENABLED === 'true',
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
  };
});
