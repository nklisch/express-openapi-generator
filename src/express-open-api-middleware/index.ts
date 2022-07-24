/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from 'openapi-types';
import { Middleware } from './middleware'
import Ajv, { ValidateFunction } from 'ajv'
import { OpenApiRequestHandler, OpenApiParameters } from '../types';
import { convertParametersToJSONSchema } from 'openapi-jsonschema-parameters'

export default class OpenApiPath {
    private static instance: OpenApiPath;
    private validate: boolean;
    private readonly operations: Map<string, ValidateFunction>;
    private validatorQueue: string[];

    private constructor() {
        this.validate = false;
        this.operations = new Map<string, ValidateFunction>();
        this.validatorQueue = [];
    }

    public static initialize({ openApiDoc, validate = false, ajv }: { openApiDoc?: OpenAPIV3.Document, validate?: boolean; ajv?: Ajv; }) {
        if (!OpenApiPath.instance) {
            OpenApiPath.instance = new OpenApiPath();
        }
        OpenApiPath.instance.initialize({ openApiDoc, validate, ajv });
    }

    public static path(operationId: string,
        {
            pathDoc,
            validate = false,
            exclude = false
        }: { pathDoc?: OpenAPIV3.OperationObject; validate?: boolean, exclude?: boolean }) {
        if (!OpenApiPath.instance) {
            OpenApiPath.instance = new OpenApiPath();
        }
        return OpenApiPath.instance.path(operationId, { pathDoc, validate, exclude })
    }

    // TODO: Expand this documentation
    /**
     * @param {string} operationId - Required unique Express App wide id representing this specific operation in the open api schema.
     */
    private path = (
        operationId: string,
        {
            pathDoc,
            validate,
            exclude
        }: { pathDoc?: OpenAPIV3.OperationObject, validate: boolean, exclude: boolean },
    ): OpenApiRequestHandler => {
        if (this.operations.has(operationId)) {
            throw new Error('operationId must be unique per express app');
        }
        validate = validate === undefined ? this.validate : validate;
        if (validate) {
            if (!pathDoc) {
                throw new Error('Required open api path operation for validation is missing')
            }
            this.validatorQueue.push(operationId)
        }
        return new Middleware(operationId, this.operations, exclude, pathDoc).openApiPathMiddleware;
    };


    private initialize = ({ openApiDoc, validate = false, ajv }: { openApiDoc?: OpenAPIV3.Document, validate?: boolean; ajv?: Ajv; }): void => {
        this.validate = validate;
        if (!ajv && validate) {
            throw new Error('An Ajv constructed object must be provided for validation')
        }
        if (!openApiDoc || !ajv) {
            return;
        }
        for (const operationId of this.validatorQueue) {
            if (this.operations.has(operationId)) {
                throw new Error(`OperationId ${operationId} is not unique. Must be unique per Express App.`)
            }
            this.operations.set(operationId, makeValidator(operationId, openApiDoc, ajv));
        }
        this.validatorQueue = [];
    }
}

const makeValidator = (operationId: string, document: OpenAPIV3.Document, ajv: Ajv): ValidateFunction => {
    let operation: OpenAPIV3.OperationObject | null = null;
    for (const path of Object.values(document.paths)) {
        if (!path) continue;
        for (const op of Object.values(path)) {
            if ((op as OpenAPIV3.OperationObject)?.operationId === operationId) {
                operation = (op as OpenAPIV3.OperationObject);
                break;
            }
        }
    }
    if (!operation) {
        throw new Error(`provided operationId: ${operationId} is not in provided open api document`)
    }
    const reqSchema: OpenApiParameters = convertParametersToJSONSchema(operation?.parameters as OpenAPIV3.ParameterObject[]);
    const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject
    if (!reqSchema.body) {
        reqSchema.body = requestBody.content['application/json'].schema
    } else if (requestBody) {
        throw new Error('May only declare an operation request body in one location')
    }
    reqSchema.components = document.components
    return ajv.compile(reqSchema)
}

