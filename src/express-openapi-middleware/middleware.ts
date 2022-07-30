import { ValidateFunction } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';
import { NextFunction, Request, Response, RequestHandler } from 'express';
import { OpenAPIV3 } from 'openapi-types';

export const middleware = (
    operationId: string,
    operations: Map<string, ValidateFunction>,
    exclude: boolean,
    operationObject?: OpenAPIV3.OperationObject,
): RequestHandler => {
    const openApiPathMiddleware = (req: Request, res: Response, next: NextFunction) => {
        if (!req.route) {
            return next(
                new Error(`OpenApiPathMiddleware must be on a route method (get, post, patch, ect) - not on a use`),
            );
        }
        const validate: ValidateFunction | undefined = openApiPathMiddleware.operations.get(operationId);
        if (!validate) {
            return next();
        }
        if (!validate(req)) {
            next(new ValidationError(validate.errors || []));
        }
        return next();
    };
    openApiPathMiddleware.operations = operations;
    openApiPathMiddleware.metadata = { operationId, exclude, operationObject };
    return openApiPathMiddleware;
};
