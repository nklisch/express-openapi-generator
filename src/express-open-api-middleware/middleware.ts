
import { Request, Response, NextFunction } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { ValidateFunction } from 'ajv'
import { OpenApiRequestHandler } from '../types';
export class Middleware {
    private readonly operationId: string;
    private readonly operations: Map<string, ValidateFunction>; // Map for validators instead
    openApiPathMiddleware: OpenApiRequestHandler
    // TODO: add validation step
    constructor(operationId: string, operations: Map<string, ValidateFunction>, pathDoc?: OpenAPIV3.OperationObject) {
        this.operationId = operationId;
        this.operations = operations;
        this.openApiPathMiddleware = function openApiPathMiddleware(req: Request, res: Response, next: NextFunction) {
            if (!req.route) {
                throw Error(`OpenApiPathMiddleware must be on a route method (get, post, patch, ect) - not on a use`);
            }
            const validate: ValidateFunction | undefined = this.operations.get(this.operationId);
            if (!validate) {
                return next();
            }
            if (!validate(req)) {
                // process errors validate.errors
            }
            return next();
        };
        this.openApiPathMiddleware.bind(this);
        this.openApiPathMiddleware.pathDoc = pathDoc;
    }
}



