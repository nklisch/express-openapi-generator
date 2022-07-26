/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from "openapi-types";

export class ResponseBuilder {
    private readonly _response: OpenAPIV3.ResponseObject
    constructor(description: string) {
        this._response = { description };
    }

    public get response() {
        return structuredClone(this._response);
    }

    public headers = (headers: {
        [header: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject;
    }) => {
        this._response.headers = structuredClone(headers);
        return this;
    }

    public content = (content: { [media: string]: OpenAPIV3.MediaTypeObject }) => {
        this._response.content = structuredClone(content);
        return (type: string, mediaTypeObject: OpenAPIV3.MediaTypeObject) => {
            if (this._response.content) {
                this._response.content[type] = structuredClone(mediaTypeObject);
            }
        };
    }

    public links = (links: {
        [link: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.LinkObject;
    }) => {
        this._response.links = structuredClone(links);
    }
}