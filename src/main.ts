import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Автоматически преобразует типы (string -> number)
      whitelist: true, // Удаляет поля, которых нет в DTO
      forbidNonWhitelisted: true, // Выбрасывает ошибку при лишних полях
      transformOptions: { enableImplicitConversion: true }, // '5' -> 5 автоматом
    }),
  );

  // ====== SWAGGER КОНФИГУРАЦИЯ ======
  const config = new DocumentBuilder()
    .setTitle('Articles API') // Название в UI
    .setDescription(
      'REST API для управления статьями с JWT аутентификацией и Redis кэшированием',
    )
    .setVersion('1.0') // Версия API
    .addBearerAuth(
      // JWT конфигурация
      {
        type: 'http', // Тип аутентификации
        scheme: 'bearer', // Схема: Bearer Token
        bearerFormat: 'JWT', // Формат токена
        name: 'JWT', // Название в UI
        description: 'Введите JWT токен (без префикса "Bearer")', // Подсказка пользователю
        in: 'header', // Токен передается в header
      },
      'JWT-auth', // Идентификатор для использования в @ApiBearerAuth()
    )
    .build();

  // Создание документа Swagger
  const document = SwaggerModule.createDocument(app, config);

  // Подключение UI по адресу: http://localhost:3000/api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Сохраняет токен между обновлениями страницы
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Приложение запущено на порту ${process.env.PORT ?? 3000}`);
  console.log(
    `📚 Swagger документация: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
