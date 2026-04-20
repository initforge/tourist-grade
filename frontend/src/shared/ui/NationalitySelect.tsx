import { Select } from 'antd';
import { NATIONALITY_OPTIONS, normalizeNationalitySearch } from '@shared/lib/nationalities';

interface NationalitySelectProps {
  value?: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function NationalitySelect({ value, onChange, ariaLabel, className }: NationalitySelectProps) {
  return (
    <Select
      showSearch
      value={value || 'Việt Nam'}
      onChange={onChange}
      options={NATIONALITY_OPTIONS}
      optionFilterProp="label"
      filterOption={(input, option) =>
        normalizeNationalitySearch(String(option?.label ?? '')).includes(normalizeNationalitySearch(input))
      }
      placeholder="Tìm quốc tịch"
      aria-label={ariaLabel}
      className={className}
      popupMatchSelectWidth={240}
      style={{ width: '100%' }}
    />
  );
}
