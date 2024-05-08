export class GenericPayload {
  statusCode: number;
  message: string;
}

export class PagePayload<T> {
  data: Array<T>;
  count: number;
}

export class AltPagePayload<T> {
  data: T;
  count: number;
}
