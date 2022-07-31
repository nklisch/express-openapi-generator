/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';

/**
 *
 */
export type ResponseDefaults = {
    headers?: { [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject };
    content?: { [media: string]: OpenAPIV3.MediaTypeObject };
    links?: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject };
    mediaType?: string;
};

export default class ResponseBuilder {
    private _mediaType?: string;
    private static _defaults?: ResponseDefaults;
    /**
     *
     * @param defaults
     */
    public static defaults(defaults: ResponseDefaults) {
        ResponseBuilder._defaults = structuredClone(defaults);
    }
    /**
     *
     * @param description
     * @returns
     */
    public static new(description: string) {
        return new ResponseBuilder(description);
    }
    private readonly _response: OpenAPIV3.ResponseObject;

    private constructor(description: string) {
        const d = structuredClone(ResponseBuilder._defaults);
        this._mediaType = ResponseBuilder._defaults?.mediaType;
        delete d?.mediaType;
        this._response = { description, ...d };
    }
    /**
     *
     */
    public build() {
        return structuredClone(this._response);
    }
    /**
     *
     * @param headers
     * @returns
     */
    public headers = (headers: { [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject }) => {
        this._response.headers = structuredClone(headers);
        return this;
    };
    /**
     *
     * @param content
     * @returns
     */
    public content = (content: { [media: string]: OpenAPIV3.MediaTypeObject }) => {
        this._response.content = structuredClone(content);
        return this;
    };
    /**
     *
     * @param media
     * @param mediaType
     * @returns
     */
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
    /**
     *
     * @param links
     * @returns
     */
    public links = (links: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject }) => {
        this._response.links = structuredClone(links);
        return this;
    };
}
