import { Client as PgClient } from 'pg';

import nil from "../../common-pure/nil";
import Database from '../Database';

const generalUserData = {
  get: async (
    dbOrClient: Database | PgClient,
    userId: string,
    collectionId: string,
    elementId: string,
  ): Promise<Uint8Array | nil> => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    const res = await pgClient.query(
      `
        SELECT data FROM general_user_data
        WHERE
          user_id = $1 AND
          collection_id = $2 AND
          element_id = $3
      `,
      [
        userId,
        collectionId,
        elementId,
      ],
    );

    const row = res.rows[0];

    if (row === nil) {
      return nil;
    }

    if (!(row.data instanceof Uint8Array)) {
      throw new Error('Unexpected row.data in generalUserData.get');
    }

    return row.data;
  },

  set: async (
    dbOrClient: Database | PgClient,
    userId: string,
    collectionId: string,
    elementId: string,
    data: Uint8Array | nil,
  ) => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    if (data instanceof Uint8Array) {
      await pgClient.query(
        `
          INSERT INTO general_user_data (
            user_id,
            collection_id,
            element_id,
            data
          ) VALUES (
            $1,
            $2,
            $3,
            $4
          )
          ON CONFLICT (user_id, collection_id, element_id)
          DO
          UPDATE SET data = $4
        `,
        [
          userId,
          collectionId,
          elementId,
          data,
        ],
      );
    } else {
      await pgClient.query(
        `
          DELETE FROM general_user_data
          WHERE
            user_id = $1 AND
            collection_id = $2 AND
            element_id = $3
        `,
        [
          userId,
          collectionId,
          elementId,
        ]
      );
    }
  },

  getRange: async (
    dbOrClient: Database | PgClient,
    userId: string,
    collectionId: string,
    minElementId: string | nil,
    maxElementId: string | nil,
    limit: number,
    direction: 'ascending' | 'descending',
  ): Promise<{ elementId: string, data: Uint8Array }[]> => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    let minMaxArgs: string[] = [];
    let minSql = '';
    let maxSql = '';
    let nextArgId = 3;

    let [minCmp, maxCmp] = (
      direction === 'ascending'
        ? ['<=', '<']
        : ['<', '<=']
    );

    if (minElementId !== nil) {
      minMaxArgs.push(minElementId);
      minSql = `AND $${nextArgId++} ${minCmp} element_id`;
    }

    if (maxElementId !== nil) {
      minMaxArgs.push(maxElementId);
      maxSql = `AND element_id ${maxCmp} $${nextArgId++}`;
    }

    const res = await pgClient.query(
      `
        SELECT element_id, data FROM general_user_data
        WHERE
          user_id = $1 AND
          collection_id = $2
          ${minSql}
          ${maxSql}
        ORDER BY element_id ${direction === 'ascending' ? 'ASC' : 'DESC'}
        LIMIT $${nextArgId++}
      `,
      [
        userId,
        collectionId,
        ...minMaxArgs,
        limit,
      ],
    );

    return res.rows.map(r => {
      const elementId = r.element_id;
      const data = r.data;

      if (typeof elementId !== 'string' || !(data instanceof Uint8Array)) {
        throw new Error('Unexpected format in generalUserData.getRange');
      }

      return { elementId, data };
    });
  },

  count: async (
    dbOrClient: Database | PgClient,
    userId: string,
    collectionId: string,
  ): Promise<number> =>  {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;

    const res = await pgClient.query(
      `
        SELECT COUNT(*) FROM general_user_data
        WHERE
          user_id = $1 AND
          collection_id = $2
      `,
      [
        userId,
        collectionId,
      ],
    );

    const count = res.rows[0].count;

    return Number(count);
  },
};

export default generalUserData;
