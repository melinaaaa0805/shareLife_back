import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://sharelife-frontend-1064055634142.europe-west1.run.app',
      'http://localhost:8081', // pour dev local
    ],
    credentials: true,
  });

  await await app.listen(3000, '0.0.0.0');
}
bootstrap();
