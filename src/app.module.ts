import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { JournalModule } from './journal/journal.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { MoodsModule } from './moods/moods.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { WellnessModule } from './wellness/wellness.module';
import { PromptsModule } from './prompts/prompts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { LegalModule } from './legal/legal.module';
import { SystemModule } from './system/system.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 10,
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    CheckInsModule,
    JournalModule,
    OnboardingModule,
    MoodsModule,
    DashboardModule,
    ReportsModule,
    WellnessModule,
    PromptsModule,
    NotificationsModule,
    SettingsModule,
    LegalModule,
    SystemModule,
    SupportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
