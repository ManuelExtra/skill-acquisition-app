export class GenericPayload {
  statusCode: number;
  message: string;
}

export class GenericPayloadAlias<T> {
  statusCode: number;
  message: string;
  data: T;
}

export class PagePayload<T> {
  data: Array<T>;
  count: number;
}

export class AltPagePayload<T> {
  data: T;
  count: number;
}
