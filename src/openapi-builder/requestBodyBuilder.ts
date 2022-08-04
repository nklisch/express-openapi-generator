/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';
import clone from '../utl';
export type RequestBodyDefaults = {
    content?: { [media: string]: OpenAPIV3.MediaTypeObject };
    mimeType?: string;
};

export default class RequestBodyBuilder {
    private static _defaults?: RequestBodyDefaults;
    private _mimeType?: string;
    private _requestBody?: OpenAPIV3.RequestBodyObject;
    private _description?: string;
    /**
     * Sets defaults for the request body object when using the build interface
     *
     * @param defaults The defaults to set - these are global to the RequestBodyBuilder class
     */
    public static defaults(defaults: RequestBodyDefaults): void {
        RequestBodyBuilder._defaults = clone(defaults);
    }
    /**
     * Start building a new request body object
     *
     * @param description The optional description of the request body object - only OpenApiv3 required field
     * @returns RequestBodyBuilder instances for method chaining
     */
    public static new(description?: string): RequestBodyBuilder {
        return new RequestBodyBuilder(description);
    }


    private constructor(description?: string) {
        this._mimeType = RequestBodyBuilder._defaults?.mimeType;
        this._description = description;
    }
    /**
     * Creates a deep copy of the current state of the request body and returns it.
     *
     * @returns A deep copy of the built request body object
     */
    public build(): OpenAPIV3.RequestBodyObject {
        if (!this._requestBody) {
            throw new Error('content/schema object required to be set to build a RequestBody.')
        }
        this._requestBody.description = this._description;
        return clone(this._requestBody);
    }

    /**
     * Short hand for build()
     * 
     * @returns A deep copy of the built request body object
     */
    public b(): OpenAPIV3.RequestBodyObject {
        return this.build();
    }

    /**
     * Add a content field to the request body object
     *
     * @param content The content object per OpenApiv3 spec
     * @returns RequestBodyBuilder instances for method chaining
     */
    public content = (content: { [media: string]: OpenAPIV3.MediaTypeObject }): RequestBodyBuilder => {
        const d = clone(RequestBodyBuilder._defaults);
        delete d?.mimeType;
        this._requestBody = { content: clone(content), ...d };
        return this;
    };
    /**
     * Add the schema object to the request body object.
     * Allows for defining the type of media in place, or inheriting a global default.
     *
     * @param schema The MediaType object per OpenApiv3 spec
     * @param mimeType The string of a valid MIME type
     * @returns RequestBodyBuilder instances for method chaining
     * @throws A error if there is no default MIME and a mimeType wasn't included locally
     */
    public schema = (
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        mimeType?: string,
    ): RequestBodyBuilder => {
        if (!mimeType && !this._mimeType) {
            throw new Error('A media type must either be select as a default or provided - e.g. application/json');
        }
        mimeType = mimeType || this._mimeType;
        const content: any = {}
        content[mimeType as string] = { schema }
        this._requestBody = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            content
        }
        return this;
    };
    /**
     * Add the schema object to the request body object as an array.
     * Allows for defining the type of media in place, or inheriting a global default.
     *
     * @param schema The MediaType object per OpenApiv3 spec
     * @param mimeType The string of a valid MIME type
     * @returns RequestBodyBuilder instances for method chaining
     * @throws A error if there is no default MIME and a mimeType wasn't included locally
     */
    public schemaArray = (
        schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
        mimeType?: string,
    ): RequestBodyBuilder => {
        this.schema({ type: 'array', items: schema }, mimeType);
        return this;
    };


}

