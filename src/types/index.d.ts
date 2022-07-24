import { NextFunction, Request, Response, Router } from 'express';
import * as ExpressInterfaces from 'express-serve-static-core';
import { OpenAPIV3 } from 'openapi-types';
import { OpenAPIParametersAsJSONSchema } from 'openapi-jsonschema-parameters';
import { ErrorObject } from 'ajv';

export interface OpenApiParameters extends OpenAPIParametersAsJSONSchema {
  components?: OpenAPIV3.ComponentsObject;
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
};

export interface Route extends ExpressInterfaces.IRoute {
  stack: Layer[];
  pathDoc: OpenAPIV3.OperationObject;
  exclude: boolean;
  name: string;
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
}

export interface Key {
  name: string;
  optional: boolean;
  offset: number;
}
