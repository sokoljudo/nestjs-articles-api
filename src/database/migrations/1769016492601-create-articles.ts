import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticles1769016492601 implements MigrationInterface {
  name = 'CreateArticles1769016492601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
  CREATE TABLE "articles" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" uuid NOT NULL,
    "publishedAt" TIMESTAMP NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_articles_author" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
  )
`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
