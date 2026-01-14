import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:5173',
    ],
    credentials: true,
  });

  await await app.listen(3000, '0.0.0.0');
}
bootstrap();
