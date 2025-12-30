import { AuthConfig } from '@/api/auth/config/auth-config.type';
import { DatabaseConfig } from '@/database/config/database-config.type';
import { KafkaConfig } from '@/libs/kafka/config/kafka-config.type';
import { RedisConfig } from '@/libs/redis/config/redis-config.type';
import { MailConfig } from '@/mail/config/mail-config.type';
import { AppConfig } from './app-config.type';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  auth: AuthConfig;
  mail: MailConfig;
  kafka: KafkaConfig;
};
