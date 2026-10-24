import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItems1792847507717 implements MigrationInterface {
  name = 'CreateOrderItems1792847507717';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_books_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_user"`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "unitPrice" integer NOT NULL, "order_id" integer NOT NULL, "book_id" integer NOT NULL, CONSTRAINT "UQ_order_items_order_book" UNIQUE ("order_id", "book_id"), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    // Переносим старые заказы в позиции. Цену на момент покупки раньше не
    // сохраняли: берём сегодняшнюю цену книги и количество 1.
    await queryRunner.query(`
            INSERT INTO "order_items" ("order_id", "book_id", "quantity", "unitPrice")
            SELECT ob."order_id", ob."book_id", 1, b."price"
            FROM "orders_books" ob
            JOIN "books" b ON b."id" = ob."book_id"
        `);
    await queryRunner.query(`DROP TABLE "orders_books"`);
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_1056dbee4616479f7d562c562df" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_baed643dd2210484ceac5ec81ea" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_baed643dd2210484ceac5ec81ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_1056dbee4616479f7d562c562df"`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders_books" ("order_id" integer NOT NULL, "book_id" integer NOT NULL, CONSTRAINT "PK_orders_books" PRIMARY KEY ("order_id", "book_id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "orders_books" ("order_id", "book_id") SELECT DISTINCT "order_id", "book_id" FROM "order_items"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders_books" ADD CONSTRAINT "FK_orders_books_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders_books" ADD CONSTRAINT "FK_orders_books_book" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_books_author" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
