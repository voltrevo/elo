import { Client as PgClient } from 'pg';

import nil from "../../common-pure/nil";
import notNil from '../../common-pure/notNil';
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
    offset: number | nil,
    direction: 'ascending' | 'descending',
  ): Promise<{ elementId: string, data: Uint8Array }[]> => {
    const pgClient = dbOrClient instanceof Database
      ? await dbOrClient.PgClient()
      : dbOrClient;
    
    const args: (string | number)[] = [];

    function addArg(a: string | number) {
      args.push(a);
      return `$${args.length}`;
    }

    let [minCmp, maxCmp] = (
      direction === 'ascending'
        ? ['<=', '<']
        : ['<', '<=']
    );

    // Note the `COLLATE "C"` below. This enforces a case sensitive sort order which is necessary
    // for timed collections to perform correctly, because their element ids represent time that
    // has been obfuscated into a text representation. This representation preserves order but
    // requires that case sensitivity is respected.
    // I am extremely surprised that case sensitivity is not the default.
    // This raises the question of whether the underlying query is performant when forcing case
    // sensitivity. In theory the PK is an index which makes this efficient, but if case sensitivity
    // is not the default then it is possible that index is not usable.
    // While user collections are relatively small it's not hugely important, but in future the
    // performance may be worth looking into. TODO.
    const res = await pgClient.query(
      `
        SELECT element_id, data FROM general_user_data
        WHERE
          user_id = ${addArg(userId)} AND
          collection_id = ${addArg(collectionId)}
          ${
            minElementId === nil
              ? ''
              : `AND ${addArg(minElementId)} ${minCmp} (element_id COLLATE "C")`
          }
          ${
            maxElementId === nil
              ? ''
              : `AND (element_id COLLATE "C") ${maxCmp} ${addArg(maxElementId)}`
          }
        ORDER BY (element_id COLLATE "C") ${direction === 'ascending' ? 'ASC' : 'DESC'}
        LIMIT ${addArg(limit)}
        ${
          offset === nil
            ? ''
            : `OFFSET ${addArg(offset)}`
        }
      `,
      args,
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
