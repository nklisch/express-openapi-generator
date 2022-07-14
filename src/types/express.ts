import { RequestHandler } from 'express';
import * as ExpressInterfaces from 'express-serve-static-core';
import { OpenAPIV3 } from 'openapi-types';

export interface Route extends ExpressInterfaces.IRoute {
    stack: Layer[]
}

export interface Router extends ExpressInterfaces.Router {
    stack: Layer[]
    pathDoc: OpenAPIV3.OperationObject
}
export interface OpenApiRequestHandler extends RequestHandler {
    operationId?: string /// Required for identifying paths from each other - must be unique per Express App
    pathDoc?: OpenAPIV3.OperationObject
    validate?: boolean
    coerceRequest?: boolean
    validator?: any
}

export interface Layer {
    handle?: Router
    stack: Layer[]
    route: Route
    name: string
    params?: ExpressInterfaces.PathParams
    path?: string
    keys: Key[]
    regexp: ExpressRegex
    method: string
}

export interface ExpressRegex extends RegExp {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    fast_slash: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    fast_star: boolean
}
export interface ExpressPath {
    path: string
    pathParams: OpenAPIV3.ParameterObject[]
    method: string
    openApiOperation?: OpenAPIV3.OperationObject | null
}


export interface Key {
    name: string,
    optional: boolean,
    offset: number
}
