import { NextFunction, Request, Response } from 'express';
import * as ExpressInterfaces from 'express-serve-static-core';
import { OpenAPIV3 } from 'openapi-types';
import { JSONSchemaType } from 'ajv'
import { OpenAPIParametersAsJSONSchema } from 'openapi-jsonschema-parameters';

export interface ExpressRequest {
  headers: Record<string, any>
  params: Record<string, any>
  query: Record<string, any>
  body: any
}

export interface OpenApiParameters extends OpenAPIParametersAsJSONSchema {
  components?: OpenAPIV3.ComponentsObject
}

export const BASE_REQ_SCHEMA: JSONSchemaType<ExpressRequest> = {
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
      '$ref': 'placeholder'
    },
  }

}

export type OpenApiRequestHandler = {
  (req: Request, res: Response, next: NextFunction): void
  pathDoc?: OpenAPIV3.OperationObject
}

export interface Route extends ExpressInterfaces.IRoute {
  stack: Layer[];
}

export interface Router extends ExpressInterfaces.Router {
  stack: Layer[];
  pathDoc: OpenAPIV3.OperationObject;
}



export interface Layer {
  handle?: Router;
  stack: Layer[];
  route: Route;
  name: string;
  params?: ExpressInterfaces.PathParams;
  path?: string;
  keys: Key[];
  regexp: ExpressRegex;
  method: string;
}

export interface ExpressRegex extends RegExp {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  fast_slash: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  fast_star: boolean;
}
export interface ExpressPath {
  path: string;
  pathParams: OpenAPIV3.ParameterObject[];
  method: string;
  openApiOperation?: OpenAPIV3.OperationObject | null;
}

export interface Key {
  name: string;
  optional: boolean;
  offset: number;
}
