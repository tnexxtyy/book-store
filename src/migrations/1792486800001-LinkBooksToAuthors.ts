import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkBooksToAuthors1792486800001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаём авторов на основе старых значений в books.author.
    await queryRunner.query(`
      CREATE TABLE "authors" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "country" VARCHAR(255) NOT NULL DEFAULT 'Unknown',
        "birthYear" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_authors_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "authors" ("name")
      SELECT DISTINCT COALESCE(NULLIF(TRIM("author"), ''), 'Unknown')
      FROM "books"
    `);

    // Добавляем поле для внешнего ключа.
    await queryRunner.query(`
      ALTER TABLE "books"
      ADD COLUMN "author_id" INTEGER
    `);

    await queryRunner.query(`
      UPDATE "books" AS b
      SET "author_id" = a."id"
      FROM "authors" AS a
      WHERE a."name" = COALESCE(NULLIF(TRIM(b."author"), ''), 'Unknown')
    `);

    await queryRunner.query(`
      ALTER TABLE "books"
      ALTER COLUMN "author_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "books"
      ADD CONSTRAINT "FK_books_author"
      FOREIGN KEY ("author_id") REFERENCES "authors"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "books"
      DROP COLUMN "author"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
      ADD COLUMN "author" VARCHAR(255)
    `);

    await queryRunner.query(`
      UPDATE "books" AS b
      SET "author" = a."name"
      FROM "authors" AS a
      WHERE a."id" = b."author_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "books"
      DROP CONSTRAINT "FK_books_author"
    `);

    await queryRunner.query(`
      ALTER TABLE "books"
      DROP COLUMN "author_id"
    `);

    await queryRunner.query(`DROP TABLE "authors"`);
  }
}
