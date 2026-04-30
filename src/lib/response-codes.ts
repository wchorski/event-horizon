// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204
export class NoContent extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoContent";
  }
}