import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791722377527 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "books" (
        "id" SERIAL NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "author" VARCHAR(255) NOT NULL,
        "price" INTEGER NOT NULL,
        CONSTRAINT "PK_books_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "books"');
  }
}
