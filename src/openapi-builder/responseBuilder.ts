/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';
import clone from '../utl';
export type ResponseDefaults = {
    headers?: { [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject };
    content?: { [media: string]: OpenAPIV3.MediaTypeObject };
    links?: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject };
    mimeType?: string;
    status?: number;
};

export default class ResponseBuilder {
    private _mimeType?: string;
    private static _defaults?: ResponseDefaults;
    /**
     * Sets defaults for the response object when using the build interface
     *
     * @param defaults The defaults to set - these are global to the ResponseBuilder class
     */
    public static defaults(defaults: ResponseDefaults): void {
        ResponseBuilder._defaults = clone(defaults);
    }
    /**
     * Start building a new Response object
     *
     * @param description The description of the response object - only OpenApiv3 required field
     * @returns ResponseBuilder instances for method chaining
     */
    public static new(description: string): ResponseBuilder {
        return new ResponseBuilder(description);
    }
    private readonly _response: OpenAPIV3.ResponseObject;

    private constructor(description: string) {
        const d = clone(ResponseBuilder._defaults);
        this._mimeType = ResponseBuilder._defaults?.mimeType;
        delete d?.mimeType;
        this._response = { description, ...d };
    }
    /**
     * Creates a deep copy of the current state of the response and returns it.
     *
     * @returns A deep copy of the built response object
     */
    public build(): OpenAPIV3.ResponseObject {
        return clone(this._response);
    }

    /**
     * Shorthand for build() method
     *
     * @returns A deep copy of the built response object
     */
    public b(): OpenAPIV3.ResponseObject {
        return this.build();
    }
    /**
     * Add a header field to the Response object
     *
     * @param headers The header object per OpenApiv3 spec
     * @returns ResponseBuilder instances for method chaining
     */
    public headers = (headers: {
        [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject;
    }): ResponseBuilder => {
        this._response.headers = clone(headers);
        return this;
    };

    /**
     * Add a content field to the Response object
     *
     * @param content The content object per OpenApiv3 spec
     * @returns ResponseBuilder instances for method chaining
     */
    public content = (content: { [media: string]: OpenAPIV3.MediaTypeObject }): ResponseBuilder => {
        this._response.content = clone(content);
        return this;
    };
    /**
     * Add the schema object to the response object.
     * Allows for defining the type of media in place, or inheriting a global default.
     *
     * @param schema The MediaType object per OpenApiv3 spec
     * @param mimeType The string of a valid MIME type
     * @returns ResponseBuilder instances for method chaining
     * @throws A error if there is no default MIME and a mimeType wasn't included locally
     */
    public schema = (
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        mimeType?: string,
    ): ResponseBuilder => {
        if (!mimeType && !this._mimeType) {
            throw new Error('A media type must either be select as a default or provided - e.g. application/json');
        }
        mimeType = mimeType || this._mimeType;
        if (!this._response.content) {
            this._response.content = {};
        }
        this._response.content[mimeType as string] = { schema };
        return this;
    };
    /**
     * Add the schema object to the response object as an array.
     * Allows for defining the type of media in place, or inheriting a global default.
     *
     * @param schema The MediaType object per OpenApiv3 spec
     * @param mimeType The string of a valid MIME type
     * @returns ResponseBuilder instances for method chaining
     * @throws A error if there is no default MIME and a mimeType wasn't included locally
     */
    public schemaArray = (
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        mimeType?: string,
    ): ResponseBuilder => {
        this.schema({ type: 'array', items: schema }, mimeType);
        return this;
    };

    /**
     * Add a links field to the Response object
     *
     * @param links The links object per OpenApiv3 spec
     * @returns ResponseBuilder instances for method chaining
     */
    public links = (links: { [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject }): ResponseBuilder => {
        this._response.links = clone(links);
        return this;
    };
}
