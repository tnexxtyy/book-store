import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndOrders20261020090002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "age" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'new',
        "totalPrice" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" INTEGER NOT NULL,
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders_books" (
        "order_id" INTEGER NOT NULL,
        "book_id" INTEGER NOT NULL,
        CONSTRAINT "PK_orders_books" PRIMARY KEY ("order_id", "book_id"),
        CONSTRAINT "FK_orders_books_order"
          FOREIGN KEY ("order_id") REFERENCES "orders"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_orders_books_book"
          FOREIGN KEY ("book_id") REFERENCES "books"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_books_order_id"
      ON "orders_books" ("order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_books_book_id"
      ON "orders_books" ("book_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orders_books"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
