/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';

export type ResponseDefaults = {
  headers?: { [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject };
  content?: { [media: string]: OpenAPIV3.MediaTypeObject };
  links?: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject };
  mediaType?: string;
};

export default class ResponseBuilder {
  private _mediaType?: string;
  private readonly _response: OpenAPIV3.ResponseObject;
  constructor(description: string, defaults?: ResponseDefaults) {
    this._mediaType = defaults?.mediaType;
    delete defaults?.mediaType;
    this._response = { description, ...structuredClone(defaults) };
  }

  public get responseObject() {
    return structuredClone(this._response);
  }

  public headers = (headers: { [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject }) => {
    this._response.headers = structuredClone(headers);
    return this;
  };

  public content = (content: { [media: string]: OpenAPIV3.MediaTypeObject }) => {
    this._response.content = structuredClone(content);
    return this;
  };

  public mediaType = (media: OpenAPIV3.MediaTypeObject, mediaType?: string) => {
    if (!mediaType && !this._mediaType) {
      throw new Error('A media type must either be select as a default or provided - e.g. application/json');
    }
    mediaType = mediaType || this._mediaType;
    if (!this._response.content) {
      this._response.content = {};
    }
    this._response.content[mediaType as string] = media;
    return this;
  };

  public links = (links: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject }) => {
    this._response.links = structuredClone(links);
    return this;
  };
}
