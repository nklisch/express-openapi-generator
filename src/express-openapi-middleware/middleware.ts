import { ValidateFunction } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';
import { NextFunction, Request, Response } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { OpenApiRequestHandler } from '../types';
export class Middleware {
  private readonly operationId: string;
  private readonly operations: Map<string, ValidateFunction>; // Map for validators instead
  openApiPathMiddlewareNklisch: OpenApiRequestHandler;
  constructor(
    operationId: string,
    operations: Map<string, ValidateFunction>,
    exclude: boolean,
    operationObject?: OpenAPIV3.OperationObject,
  ) {
    this.operationId = operationId;
    this.operations = operations;
    this.openApiPathMiddlewareNklisch = function openApiPathMiddlewareNklisch(req: Request, res: Response, next: NextFunction) {
      if (!req.route) {
        return next(
          new Error(`OpenApiPathMiddleware must be on a route method (get, post, patch, ect) - not on a use`),
        );
      }
      const validate: ValidateFunction | undefined = this.operations.get(this.operationId);
      if (!validate) {
        return next();
      }
      if (!validate(req)) {
        next(new ValidationError(validate.errors || []));
      }
      return next();
    };
    this.openApiPathMiddlewareNklisch.bind(this);
    this.openApiPathMiddlewareNklisch.pathDoc = operationObject;
    this.openApiPathMiddlewareNklisch.exclude = exclude;
    this.openApiPathMiddlewareNklisch.operationId = operationId;
  }
}
