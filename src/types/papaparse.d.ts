declare module "papaparse" {
  export interface ParseError {
    message: string;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
  }

  export interface ParseConfig<T> {
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (result: ParseResult<T>) => void;
    error?: (error: Error) => void;
  }

  const Papa: {
    parse<T>(input: File | string, config: ParseConfig<T>): void;
  };

  export default Papa;
}
