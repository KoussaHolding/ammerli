import { type AllConfigType } from '@/config/config.type';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function setupSwagger(app: INestApplication, prefix: string) {
  const configService = app.get(ConfigService<AllConfigType>);
  const appName = configService.getOrThrow('app.name', { infer: true });

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('A boilerplate project')
    .setVersion('1.0')
    .setContact('Company Name', 'https://example.com', 'contact@company.com')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'Api-Key', in: 'header' }, 'Api-Key')
    .build();

  // Create OpenAPI document
  const document = SwaggerModule.createDocument(app, config);

  // Default Swagger UI
  SwaggerModule.setup(`${prefix}/api-docs`, app, document, {
    customSiteTitle: appName,
  });

  // Scalar API Reference (World-Class UI)
  const { apiReference } = require('@scalar/nestjs-api-reference');
  app.use(
    `/${prefix}/docs`,
    apiReference({
      spec: {
        content: document,
      },
    }),
  );
}

export default setupSwagger;
