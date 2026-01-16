import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentModule } from './modules/student/student.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/candidate-test',
      }),
      inject: [ConfigService],
    }),
    StudentModule,
    ChatModule,
    AiModule,
    KnowledgeModule,
  ],
})
export class AppModule {}
