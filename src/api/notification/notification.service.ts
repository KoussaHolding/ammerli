import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { DeviceTokenEntity } from './entities/device-token.entity';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(DeviceTokenEntity)
    private readonly deviceTokenRepo: Repository<DeviceTokenEntity>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(NotificationService.name);
  }

  onModuleInit() {
    // Initialize Firebase Admin SDK
    // Consider moving credentials to ConfigService/environment variables
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(), 
          // Ideally: admin.credential.cert(serviceAccount) from config
        });
        this.logger.log('Firebase Admin Initialized');
      } catch (error) {
        this.logger.error('Firebase Init Failed', error);
      }
    }
  }

  async saveToken(userId: string, token: string, platform: string, userType: 'USER' | 'DRIVER') {
    // Check if token already exists for this user to avoid duplicates
    const existing = await this.deviceTokenRepo.findOne({ where: { token } });
    if (existing) {
      if (existing.userId !== userId) {
        // Token moved to a new user (logout/login scenario)
        existing.userId = userId;
        existing.userType = userType;
        await this.deviceTokenRepo.save(existing);
      }
      return existing;
    }

    const newToken = this.deviceTokenRepo.create({
      userId,
      token,
      platform,
      userType,
    });
    return await this.deviceTokenRepo.save(newToken);
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.deviceTokenRepo.find({ where: { userId } });
    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.token);

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data,
      });
      
      this.logger.log(`Sent push to ${userId}: ${response.successCount} success, ${response.failureCount} failed`);
      
      // Cleanup invalid tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            // Remove invalid token
             this.deviceTokenRepo.delete({ token: fcmTokens[idx] });
          }
        });
      }

    } catch (error) {
      this.logger.error(`Error sending push to ${userId}`, error);
    }
  }
}
