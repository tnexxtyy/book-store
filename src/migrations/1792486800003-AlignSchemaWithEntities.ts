import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignSchemaWithEntities1792486800003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // IF NOT EXISTS: на базе, где колонки уже добавлены вручную, миграция не упадёт.
    await queryRunner.query(`
      ALTER TABLE "books"
      ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "publishedYear" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    `);

    // Дефолты нужны только чтобы заполнить уже существующие строки.
    await queryRunner.query(`
      ALTER TABLE "books"
      ALTER COLUMN "description" DROP DEFAULT,
      ALTER COLUMN "publishedYear" DROP DEFAULT
    `);

    // Остаток не уйдёт в минус, даже если в коде появится ошибка.
    await queryRunner.query(`
      ALTER TABLE "books" ADD CONSTRAINT "CHK_books_stock" CHECK ("stock" >= 0)
    `);

    // Для enum-колонки TypeORM ждёт тип Postgres <таблица>_<колонка>_enum.
    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM ('new', 'paid', 'cancelled')
    `);

    // Дефолт снимаем отдельно: строковый дефолт не приводится к enum сам.
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "orders"
      ALTER COLUMN "status" TYPE "public"."orders_status_enum"
      USING "status"::text::"public"."orders_status_enum"
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'new'`,
    );

    // Дефолты авторов были нужны только для переноса из books.author.
    await queryRunner.query(`
      ALTER TABLE "authors"
      ALTER COLUMN "country" DROP DEFAULT,
      ALTER COLUMN "birthYear" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "authors"
      ALTER COLUMN "country" SET DEFAULT 'Unknown',
      ALTER COLUMN "birthYear" SET DEFAULT 1
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`
      ALTER TABLE "orders" ALTER COLUMN "status" TYPE VARCHAR USING "status"::text
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'new'`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "CHK_books_stock"`,
    );
    await queryRunner.query(`
      ALTER TABLE "books"
      DROP COLUMN "createdAt",
      DROP COLUMN "stock",
      DROP COLUMN "publishedYear",
      DROP COLUMN "description"
    `);
  }
}
