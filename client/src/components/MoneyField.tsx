import { InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import { formatNumber, parseNumber } from '../lib/format';

type Props = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
};

/** A currency text field that shows thousands separators and emits a plain number. */
export default function MoneyField({ value, onChange, suffix = 'đ', ...rest }: Props) {
  return (
    <TextField
      {...rest}
      value={value ? formatNumber(value) : ''}
      onChange={(e) => onChange(parseNumber(e.target.value))}
      inputProps={{ inputMode: 'numeric', ...(rest.inputProps || {}) }}
      InputProps={{
        endAdornment: <InputAdornment position="end">{suffix}</InputAdornment>,
      }}
    />
  );
}
