import * as React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TextField from '@mui/material/TextField';
import type { Locale } from 'date-fns';
import * as locales from 'date-fns/locale';

import nil from '../../common-pure/nil';

const currentLocale: Locale = (() => {
  for (const locale of Object.values(locales)) {
    if (locale.code === navigator.language) {
      return locale;
    }
  }

  return locales.enUS;
})();

type Props = {
  value: Date;
  onChange: (newValue: Date | nil) => void;
};

const EloDatePicker: React.FunctionComponent<Props> = ({ value, onChange }) => (
  <LocalizationProvider
    dateAdapter={AdapterDateFns}
    adapterLocale={currentLocale}
  >
    <DatePicker
      value={value}
      onChange={(newValue) => onChange(newValue ?? nil)}
      renderInput={(params) => <TextField {...params} />}
    />
  </LocalizationProvider>
);

export default EloDatePicker;
