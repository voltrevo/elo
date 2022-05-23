import { PromisifyApi } from "../common-pure/protocolHelpers";
import Database from "../database/Database";
import StorageProtocol, { SetCommand } from "../elo-types/StorageProtocol";
import generalUserData from "../database/queries/generalUserData";
import nil from "../common-pure/nil";
import monthlyGeneralUserStats from "../database/queries/monthlyGeneralUserStats";
import { formatFullMonth } from "../database/queries/stats";

export type StorageProtocolImpl = PromisifyApi<StorageProtocol>;

const monthlyWriteLimit = 10 * 2 ** 20; // 10 MiB

export default function StorageProtocolImpl(db: Database, userId: string, userRowLimit: number): StorageProtocolImpl {
  const impl: StorageProtocolImpl = {
    get: async ({ collectionId, elementId }) => ({
      element: await generalUserData.get(db, userId, collectionId, elementId),
    }),
    set: async (command: SetCommand) => {
      const formattedMonth = formatFullMonth(new Date());
      const writeLen = getWriteLen(userId, command);

      if (await wouldExceedWriteLimit(db, userId, formattedMonth, writeLen)) {
        throw new Error('#write-limit: Operation would exceed monthly write limit');
      }

      await db.transaction(pgClient => Promise.all([
        monthlyGeneralUserStats.add(
          pgClient,
          userId,
          formattedMonth,
          'generalBytesWritten',
          writeLen,
        ),
        generalUserData.set(
          pgClient,
          userId,
          command.collectionId,
          command.elementId,
          command.element,
        ),
      ]));

      return {};
    },
    setMulti: async ({ commands }) => {
      const formattedMonth = formatFullMonth(new Date());

      const writeLen = (commands
        .map(c => getWriteLen(userId, c))
        .reduce((a, b) => a + b, 0)
      );

      if (await wouldExceedWriteLimit(db, userId, formattedMonth, writeLen)) {
        throw new Error('#write-limit: Operation would exceed monthly write limit');
      }

      await db.transaction(pgClient => Promise.all([
        monthlyGeneralUserStats.add(
          pgClient,
          userId,
          formattedMonth,
          'generalBytesWritten',
          writeLen,
        ),
        ...commands.map(({
          collectionId,
          elementId,
          element,
        }) => generalUserData.set(
          pgClient,
          userId,
          collectionId,
          elementId,
          element,
        )),
      ]));

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
    UsageInfo: async () => ({
      used: await monthlyGeneralUserStats.get(
        db,
        userId,
        formatFullMonth(new Date()),
        'generalBytesWritten',
      ),
      capacity: monthlyWriteLimit,
      unit: 'bytes written/month',
    }),
  };

  return impl;
}

function getWriteLen(userId: string, command: SetCommand) {
  return (
    userId.length +
    command.collectionId.length +
    command.elementId.length +
    (command.element?.length ?? 0)
  );
}

async function wouldExceedWriteLimit(
  db: Database,
  userId: string,
  formattedMonth: string,
  writeLen: number,
) {
  const bytesWritten = await monthlyGeneralUserStats.get(
    db,
    userId,
    formattedMonth,
    'generalBytesWritten',
  );

  return bytesWritten + writeLen > monthlyWriteLimit;
}
