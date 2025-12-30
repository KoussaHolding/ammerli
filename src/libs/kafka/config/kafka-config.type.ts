export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  username?: string;
  password?: string;
  caPath?: string;
  sslEnabled: boolean;
  saslEnabled: boolean;
  groupId: string;
}
