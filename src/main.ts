import { initalizeNestApplication } from './app';

async function bootstrap() {
  const app = await initalizeNestApplication();

  await app.listen(process.env.PORT ?? 8080);
  console.log(`Server is running on port ${process.env.PORT ?? 8080}`);
}
bootstrap();
