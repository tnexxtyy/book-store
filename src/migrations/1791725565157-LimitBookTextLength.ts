import { MigrationInterface, QueryRunner } from 'typeorm';

export class LimitBookTextLength1791725565157 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
      ALTER COLUMN "title" TYPE VARCHAR(255),
      ALTER COLUMN "author" TYPE VARCHAR(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "books"
      ALTER COLUMN "title" TYPE VARCHAR,
      ALTER COLUMN "author" TYPE VARCHAR
    `);
  }
}
