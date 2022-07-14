import { Request, Response, NextFunction } from "express";
import { OpenAPIV3 } from "openapi-types";
import { OpenApiRequestHandler } from "../types/express";


export class OpenApiPath {
    private readonly validate: boolean
    private readonly coerceRequest: boolean
    private readonly document?: OpenAPIV3.Document
    constructor({ openApiDoc, validate = false, coerceRequest = false }: { openApiDoc?: OpenAPIV3.Document, validate?: boolean, coerceRequest?: boolean }) {
        this.validate = validate;
        this.coerceRequest = coerceRequest;
        this.document = openApiDoc;
    }
    // TODO: Expand this documentation
    /** 
    * @param {string} operationId - Required unique Express App wide id representing this specific operation in the open api schema. 
    */
    path = (operationId: string, { pathDoc, validate, coerceRequest }: { pathDoc?: OpenAPIV3.OperationObject, validate?: boolean, coerceRequest?: boolean }): OpenApiRequestHandler => {
        validate = validate === undefined ? this.validate : validate;
        coerceRequest = coerceRequest === undefined ? this.coerceRequest : coerceRequest;
        const m: Middleware = new Middleware(operationId, pathDoc, validate, coerceRequest);
        //  m.validator = makeValidator();
        return m.middleware;
    }


}

class Middleware {
    private readonly validate: boolean
    private readonly coerceRequest: boolean
    private readonly pathDoc?: OpenAPIV3.OperationObject
    private readonly operationId: string
    // TODO: add validation step
    // private readonly validator: 
    constructor(operationId: string, pathDoc?: OpenAPIV3.OperationObject, validate: boolean, coerceRequest: boolean) {
        this.validate = validate;
        this.coerceRequest = coerceRequest;
        this.pathDoc = pathDoc;
        this.operationId = operationId;
    }
    middleware = (req: Request, res: Response, next: NextFunction): void => {
        if (!req.route) {
            throw Error(`OpenApiPathMiddleware must be on a route method (get, post, patch, ect) - not on a use`)
        }
        if (!this.validate || !this.pathDoc) {
            next();
        }
        if (!this.)
            next();
    }
}

const makeValidator = () => {
    const reqSchema = merge({}, BASE_REQ_SCHEMA)

    // Compile req schema on first request
    // Build param validation
    schema.parameters && schema.parameters.forEach((p) => {
        switch (p.in) {
            case 'path':
                reqSchema.properties.params.properties[p.name] = p.schema
                p.required && !reqSchema.properties.params.required.includes(p.name) && reqSchema.properties.params.required.push(p.name)
                break
            case 'query':
                reqSchema.properties.query.properties[p.name] = p.schema
                p.required && !reqSchema.properties.query.required.includes(p.name) && reqSchema.properties.query.required.push(p.name)
                break
            case 'header':
                const name = p.name.toLowerCase()
                reqSchema.properties.headers.properties[name] = p.schema
                p.required && !reqSchema.properties.headers.required.includes(p.name) && reqSchema.properties.headers.required.push(name)
                break
        }
    })

    // Compile req body schema
    schema.requestBody && Object.entries(schema.requestBody.content)
        .forEach(([contentType, { schema }]) => {
            switch (contentType) {
                case 'application/json':
                    reqSchema.properties.body = schema
                    break
                default:
                    throw new TypeError(`Validation of content type not supported: ${contentType}`)
            }
        })

    // Add components for references
    reqSchema.components = middleware.document && middleware.document.components

    return ajv.compile(reqSchema)
}


const BASE_REQ_SCHEMA = {
    type: 'object',
    required: ['headers', 'params', 'query'],
    properties: {
        headers: {
            type: 'object',
            required: [],
            properties: {}
        },
        params: {
            type: 'object',
            required: [],
            properties: {}
        },
        query: {
            type: 'object',
            required: [],
            properties: {}
        },
        body: {
            type: 'object',
            required: [],
            properties: {}
        }
    }
}