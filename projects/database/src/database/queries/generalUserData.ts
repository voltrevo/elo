import nil from "../../common-pure/nil";
import Database from "../Database";

const generalUserData = {
  get: async (
    db: Database,
    userId: string,
    collectionId: string,
    elementId: string,
  ): Promise<Uint8Array | nil> => {
    const pgClient = await db.PgClient();

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
    db: Database,
    userId: string,
    collectionId: string,
    elementId: string,
    data: Uint8Array | nil,
  ) => {
    const pgClient = await db.PgClient();

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
    db: Database,
    userId: string,
    collectionId: string,
    minElementId: string | nil,
    maxElementId: string | nil,
    limit: number,
  ): Promise<{ elementId: string, data: Uint8Array }[]> => {
    const pgClient = await db.PgClient();

    let minMaxArgs: string[] = [];
    let minSql = '';
    let maxSql = '';
    let nextArgId = 3;

    if (minElementId !== nil) {
      minMaxArgs.push(minElementId);
      minSql = `AND $${nextArgId++} <= element_id`;
    }

    if (maxElementId !== nil) {
      minMaxArgs.push(maxElementId);
      maxSql = `AND element_id < $${nextArgId++}`;
    }

    const res = await pgClient.query(
      `
        SELECT element_id, data FROM general_user_data
        WHERE
          user_id = $1 AND
          collection_id = $2
          ${minSql}
          ${maxSql}
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
    db: Database,
    userId: string,
    collectionId: string,
  ): Promise<number> =>  {
    const pgClient = await db.PgClient();

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

    if (typeof count !== 'number') {
      throw new Error('Unexpected format in generalUserData.count');
    }

    return count;
  },
};

export default generalUserData;
