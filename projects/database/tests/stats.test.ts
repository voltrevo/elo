import 'source-map-support/register';

import assert from '../src/common-pure/assert';
import { formatFullDate, formatFullMonth } from '../src/database/queries/stats';

describe('formats', () => {
  it('generates expected date format', () => {
    assert(formatFullDate(new Date('2022-01-21T03:31:50.601Z')) === '2022-01-21');
  });

  it('generates expected month format', () => {
    assert(formatFullMonth(new Date('2022-01-21T03:31:50.601Z')) === '202201');
  });
});
