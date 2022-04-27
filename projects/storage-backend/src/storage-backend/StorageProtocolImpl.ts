import { PromisifyApi } from "../common-pure/protocolHelpers";
import Database from "../database/Database";
import StorageProtocol from "../elo-types/StorageProtocol";
import generalUserData from "../database/queries/generalUserData";
import nil from "../common-pure/nil";

export type StorageProtocolImpl = PromisifyApi<StorageProtocol>;

export default function StorageProtocolImpl(db: Database, userId: string, userRowLimit: number): StorageProtocolImpl {
  const impl: StorageProtocolImpl = {
    get: async ({ collectionId, elementId }) => ({
      element: await generalUserData.get(db, userId, collectionId, elementId),
    }),
    set: async ({ collectionId, elementId, element }) => {
      // TODO: implement write limit
      await generalUserData.set(db, userId, collectionId, elementId, element);

      return {};
    },
    setMulti: async ({ commands }) => {
      // TODO: implement write limit
      const tx = await db.begin();

      await Promise.all(
        commands.map(({
          collectionId,
          elementId,
          element,
        }) => generalUserData.set(
          tx.pgClient,
          userId,
          collectionId,
          elementId,
          element,
        )),
      );

      await tx.commit();

      return {};
    },
    getRange: async ({ collectionId, minElementId, maxElementId }) => {
      const rows = await generalUserData.getRange(
        db,
        userId,
        collectionId,
        minElementId,
        maxElementId,
        userRowLimit + 1,
      );

      let nextElementId: string | nil = nil;

      if (rows.length > userRowLimit) {
        nextElementId = rows[userRowLimit].elementId;
      }

      return {
        entries: rows
          .slice(0, userRowLimit)
          .map(({ elementId, data }) => [elementId, data]),
        nextElementId,
      };
    },
    count: async ({ collectionId }) => ({
      count: await generalUserData.count(db, userId, collectionId),
    }),
    UsageInfo: async () => {
      // TODO: implement write limit

      return {
        used: 0,
        capacity: 1,
        unit: '',
      };
    },
  };

  return impl;
}
