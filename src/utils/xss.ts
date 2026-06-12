export function sanitizeTacticName(input: string): string {
  if (!input) return '';
  let result = input;
  result = result.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  result = result.replace(/<\/?[^>]+(>|$)/g, '');
  result = result.replace(/[<>]/g, '');
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/on\w+\s*=/gi, '');
  result = result.trim();
  return result.slice(0, 6);
}

export function isXssSafe(input: string): boolean {
  const sanitized = sanitizeTacticName(input);
  return sanitized === input.trim();
}
