export type ClassValue = string | number | null | undefined | ClassValue[] | { [key: string]: boolean | string | number | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  const push = (value: ClassValue) => {
    if (!value && value !== 0) return;
    if (typeof value === 'string' || typeof value === 'number') {
      if (String(value).trim()) classes.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, v]) => {
        if (v) classes.push(key);
      });
    }
  };

  inputs.forEach(push);
  return classes.join(' ');
}




