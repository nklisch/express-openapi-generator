
import { Request, Response, NextFunction } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { ValidateFunction } from 'ajv'
import { OpenApiRequestHandler } from '../types';
import ValidationError from 'ajv/dist/runtime/validation_error';
export class Middleware {
    private readonly operationId: string;
    private readonly operations: Map<string, ValidateFunction>; // Map for validators instead
    openApiPathMiddleware: OpenApiRequestHandler
    constructor(operationId: string, operations: Map<string, ValidateFunction>, exclude: boolean, pathDoc?: OpenAPIV3.OperationObject) {
        this.operationId = operationId;
        this.operations = operations;
        this.openApiPathMiddleware = function openApiPathMiddleware(req: Request, res: Response, next: NextFunction) {
            if (!req.route) {
                return next(new Error(`OpenApiPathMiddleware must be on a route method (get, post, patch, ect) - not on a use`));
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
        this.openApiPathMiddleware.bind(this);
        this.openApiPathMiddleware.pathDoc = pathDoc;
        this.openApiPathMiddleware.exclude = exclude;
    }
}



