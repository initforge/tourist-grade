interface PageSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function PageSearchInput({ value, onChange, placeholder, className = '' }: PageSearchInputProps) {
  return (
    <div className={`relative w-full max-w-xl ${className}`.trim()}>
      <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-primary/35">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={event => onChange(event?.target?.value)}
        placeholder={placeholder}
        className="w-full border border-outline-variant/40 bg-white py-3 pl-12 pr-12 text-sm text-primary outline-none transition-colors placeholder:text-primary/30 focus:border-[var(--color-secondary)]"
      />
      {value && (
        <button
          type="button"
          title="Xóa tìm kiếm"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/35 transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}
