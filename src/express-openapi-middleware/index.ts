/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from 'openapi-types';
import { middleware } from './middleware';
import Ajv, { AnySchema, ValidateFunction } from 'ajv';
import { RequestHandler } from 'express';
import clone from '../utl';
export default class PathMiddleware {
    private static instance: PathMiddleware;
    private validate: boolean;
    private readonly operations: Map<string, ValidateFunction>;
    private validatorQueue: string[];

    private constructor() {
        this.validate = false;
        this.operations = new Map<string, ValidateFunction>();
        this.validatorQueue = [];
    }
    /**
     * Initializes the validation feature for the path middlewares. Must be placed right before starting Express app.
     *
     * @param openApiDoc - Document that is used to validate routes. OperationId's must match pathMiddleware operationIds
     * @param ajv - Ajv client instance - user configured, provided and defined.
     * @throws
     * - If no path middleware have been created (attached to at least one route)
     * - If open api document or ajv instances is missing
     * - If an operationId is not unique
     * - If an operation object on the OpenApiv3 document was not found with one of the operationIds
     */
    public static initializeValidation(openApiDoc: OpenAPIV3.Document, ajv: Ajv): void {
        if (!PathMiddleware.instance) {
            throw new Error(
                'Instance not initialized, OpenApiPathMiddleware.initializeValidation requires path middleware on at least one route',
            );
        }
        PathMiddleware.instance.initializeValidation(openApiDoc, ajv);
    }
    /**
     * Creates a path middleware that attaches to a route, providing meta-data for the express parser to pick up.
     *
     * @param  operationId - Required unique Express App wide id representing this specific operation in the open api schema.
     * @param  param - Object to hold optional parameters
     * @param  param.operationObject - The Open Api operation object for this route.
     * @param  param.validate - Overrides global validation option for this route.
     * @param  param.exclude - Indicates if this route should be marked for exclusion when generating OpenApi documents.
     * @returns An Express middleware object to attach to a route
     * @throws
     * - If operationId is not unique per express app,
     * - If validation is selected and no OpenApi document is provided.
     */
    public static path(
        operationId: string,
        {
            operationObject,
            validate = false,
            exclude = false,
        }: { operationObject?: OpenAPIV3.OperationObject; validate?: boolean; exclude?: boolean },
    ): RequestHandler {
        if (!PathMiddleware.instance) {
            PathMiddleware.instance = new PathMiddleware();
        }
        return PathMiddleware.instance.path(operationId, { operationObject, validate, exclude });
    }

    private path = (
        operationId: string,
        {
            operationObject,
            validate,
            exclude,
        }: { operationObject?: OpenAPIV3.OperationObject; validate: boolean; exclude: boolean },
    ): RequestHandler => {
        if (this.operations.has(operationId)) {
            throw new Error('operationId must be unique per express app');
        }
        validate = validate === undefined ? this.validate : validate;
        if (validate) {
            if (!operationObject) {
                throw new Error('Required open api path operation for validation is missing');
            }
            this.validatorQueue.push(operationId);
        }
        return middleware(operationId, this.operations, exclude, operationObject);
    };

    private initializeValidation = (openApiDoc: OpenAPIV3.Document, ajv: Ajv): void => {
        this.validate = true;
        if (!openApiDoc || !ajv) {
            throw new Error('OpenApi document and Ajv instance required for path validation');
        }
        if (openApiDoc.components) {
            for (const field of Object.keys(openApiDoc.components)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                for (const [name, component] of Object.entries((openApiDoc.components as any)[field])) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    ajv.addSchema(component as AnySchema, `#/components/${field}/${name}`);
                }
            }
        }
        for (const operationId of this.validatorQueue) {
            if (this.operations.has(operationId)) {
                throw new Error(`OperationId ${operationId} is not unique. Must be unique per Express App.`);
            }
            this.operations.set(operationId, makeValidator(operationId, openApiDoc, ajv));
        }
        this.validatorQueue = [];
    };
}

const makeValidator = (operationId: string, doc: OpenAPIV3.Document, ajv: Ajv): ValidateFunction => {
    const operation = selectOperation(operationId, doc.paths);
    if (!operation) {
        throw new Error(`provided operationId: ${operationId} is not in provided open api document`);
    }
    const reqSchema = { ...clone(BASE_REQ_SCHEMA) };
    if (operation && operation.parameters) {
        const map: any = { path: 'params', query: 'query', header: 'header' };
        for (let p of operation?.parameters) {
            if ((p as OpenAPIV3.ReferenceObject)?.$ref) {
                p = resolveReference(doc, (p as OpenAPIV3.ReferenceObject).$ref);
            }
            p = p as OpenAPIV3.ParameterObject;
            reqSchema.properties[map[p.in]].properties[p.name] = clone(p.schema);
            if (p.required && !reqSchema.properties[map[p.in]].required.includes(p.name)) {
                reqSchema.properties[map[p.in]].required.push(p.name);
            }
        }
    }
    const requestBody = (operation?.requestBody as OpenAPIV3.ReferenceObject)?.$ref
        ? resolveReference(doc, (operation?.requestBody as OpenAPIV3.ReferenceObject).$ref)
        : operation?.requestBody;
    const requestBodySchema = (requestBody as OpenAPIV3.RequestBodyObject)?.content['application/json']?.schema;
    if (requestBodySchema) {
        reqSchema.properties.body = { ...requestBodySchema };
        if (requestBody.required) {
            reqSchema.required.push('body');
        }
    }
    return ajv.compile(reqSchema);
};

const selectOperation = (operationId: string, paths: OpenAPIV3.PathsObject): OpenAPIV3.OperationObject | undefined => {
    for (const path of Object.values(paths)) {
        if (!path) continue;
        for (const op of Object.values(path)) {
            if ((op as OpenAPIV3.OperationObject)?.operationId === operationId) {
                return op as OpenAPIV3.OperationObject;
            }
        }
    }
    return undefined;
};

const resolveReference = (document: any, ref: string) => {
    const selector = ref.split('/');
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return clone(document[selector[1]][selector[2]][selector[3]]);
    } catch (e) {
        throw new Error('provided document reference is not in standard format: ' + ref);
    }
};

const BASE_REQ_SCHEMA: any = {
    type: 'object',
    required: ['headers', 'params', 'query'],
    properties: {
        headers: {
            type: 'object',
            required: [],
            properties: {},
        },
        params: {
            type: 'object',
            required: [],
            properties: {},
        },
        query: {
            type: 'object',
            required: [],
            properties: {},
        },
    },
};

export const onlyForTesting = { makeValidator, selectOperation };
