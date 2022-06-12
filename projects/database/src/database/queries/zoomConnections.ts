import * as io from 'io-ts';
import * as ioTypes from 'io-ts-types';

import Database from '../Database';
import nil from '../../common-pure/nil';
import decode from '../../elo-types/decode';
import optional from '../../elo-types/optional';
import deepNullToNil from '../../common-pure/deepNullToNil';

const ZoomConnection = io.type({
  user_id: io.string,
  zoom_id: io.string,
  zoom_email: io.string,
  presence_status: optional(io.string),
  presence_update_time: optional(ioTypes.date)
});

type ZoomConnection = io.TypeOf<typeof ZoomConnection>;

const zoomConnections = {
  upsert: async (
    db: Database,
    {
      user_id,
      zoom_id,
      zoom_email,
      presence_status,
      presence_update_time,
    }: ZoomConnection,
  ) => {
    const pgClient = await db.PgClient();
  
    await pgClient.query(
      `
        INSERT INTO zoom_connections (
          user_id,
          zoom_id,
          zoom_email,
          presence_status,
          presence_update_time
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT (user_id)
        DO
        UPDATE SET
          zoom_id = $2,
          zoom_email = $3,
          presence_status = $4,
          presence_update_time = $5
      `,
      [
        user_id,
        zoom_id,
        zoom_email,
        presence_status,
        presence_update_time,
      ],
    );
  },

  lookup: async (
    db: Database,
    user_id: string,
  ) => {
    const pgClient = await db.PgClient();

    const res = await pgClient.query(
      `
        SELECT * FROM zoom_connections
        WHERE user_id = $1
      `,
      [user_id],
    );
  
    const result = res.rows[0];
  
    if (result === nil) {
      return nil;
    }
  
    return decode(ZoomConnection, deepNullToNil(result));
  },

  updatePresence: async (
    db: Database,
    zoom_id: string,
    presence_status: string | nil,
    presence_update_time: Date | nil,
  ) => {
    const pgClient = await db.PgClient();

    await pgClient.query(
      `
        UPDATE zoom_connections SET
          presence_status = $2,
          presence_update_time = $3
        WHERE
          zoom_id = $1
      `,
      [
        zoom_id,
        presence_status,
        presence_update_time,
      ],
    );
  },

  remove: async (
    db: Database,
    user_id: string,
  ) => {
    const pgClient = await db.PgClient();
  
    await pgClient.query(
      'DELETE FROM zoom_connections WHERE user_id = $1',
      [user_id],
    );
  },
};

export default zoomConnections;
