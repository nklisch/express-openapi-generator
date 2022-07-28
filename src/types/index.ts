import { NextFunction, Request, Response, Router } from 'express';
import * as ExpressInterfaces from 'express-serve-static-core';
import { OpenAPIV3 } from 'openapi-types';
import { ErrorObject } from 'ajv';

export type Component =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3.ResponseObject
  | OpenAPIV3.ParameterObject
  | OpenAPIV3.ExampleObject
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3.HeaderObject
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3.LinkObject
  | OpenAPIV3.CallbackObject;

export type ComponentParameter = { name: string; component?: Component; copy?: boolean };

export enum CompositeSchemaTypes {
  allOf = 'allOf',
  oneOf = 'oneOf',
  anyOf = 'anyOf',
}

export enum ComponentFieldNames {
  schemas = 'schemas',
  responses = 'responses',
  parameters = 'parameters',
  examples = 'examples',
  requestBodies = 'requestBodies',
  headers = 'headers',
  securitySchemes = 'securitySchemes',
  links = 'links',
  callbacks = 'callbacks',
}

export interface ValidationError extends Error {
  validationErrors: ErrorObject;
}

export type OpenApiRequestHandler = {
  (req: Request, res: Response, next: NextFunction): void;
  pathDoc?: OpenAPIV3.OperationObject;
  exclude?: boolean;
  operationId?: string;
};

export interface Route extends ExpressInterfaces.IRoute {
  stack: Layer[];
  pathDoc?: OpenAPIV3.OperationObject;
  exclude?: boolean;
  name: string;
  operationId?: string;
}

export interface Layer {
  handle?: Route | Router;
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
  openApiOperation?: OpenAPIV3.OperationObject;
  exclude: boolean;
  operationId?: string;
}

export interface Key {
  name: string;
  optional: boolean;
  offset: number;
}
