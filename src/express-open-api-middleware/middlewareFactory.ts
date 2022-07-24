/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from 'openapi-types';
import { Middleware } from './middleware';
import Ajv, { ValidateFunction } from 'ajv';
import { OpenApiRequestHandler, OpenApiParameters } from '../types';
import { convertParametersToJSONSchema } from 'openapi-jsonschema-parameters';

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
  /**
   * Initializes the validation feature for the path middlewares. Must be placed right before starting Express app.
   *
   * @param openApiDoc - Document that is used to validate routes. OperationId's must match pathMiddleware operationIds
   * @param ajv - Ajv validation instance - user configured, provided and defined.
   */
  public static initializeValidation(openApiDoc: OpenAPIV3.Document, ajv: Ajv) {
    if (!OpenApiPath.instance) {
      OpenApiPath.instance = new OpenApiPath();
    }
    OpenApiPath.instance.initializeValidation(openApiDoc, ajv);
  }
  /**
   * Creates an openApiPath middleware that attaches to a route, providing meta-data for the express parser to pick up.
   *
   * @param {string} operationId - Required unique Express App wide id representing this specific operation in the open api schema.
   * @param {object} param - Object to hold optional parameters
   * @param {OpenAPIV3.OperationObject} param.operationObject - The Open Api operation object for this route.
   * @param {boolean} param.validate - Overrides global validation option for this route.
   * @param {boolean} param.exclude - Indicates if this route should be marked for exclusion when generating OpenApi documents.
   * @returns {OpenApiRequestHandler}
   */
  public static path(
    operationId: string,
    {
      operationObject,
      validate = false,
      exclude = false,
    }: { operationObject?: OpenAPIV3.OperationObject; validate?: boolean; exclude?: boolean },
  ) {
    if (!OpenApiPath.instance) {
      OpenApiPath.instance = new OpenApiPath();
    }
    return OpenApiPath.instance.path(operationId, { operationObject, validate, exclude });
  }

  private path = (
    operationId: string,
    {
      operationObject,
      validate,
      exclude,
    }: { operationObject?: OpenAPIV3.OperationObject; validate: boolean; exclude: boolean },
  ): OpenApiRequestHandler => {
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
    return new Middleware(operationId, this.operations, exclude, operationObject).openApiPathMiddleware;
  };

  private initializeValidation = (openApiDoc: OpenAPIV3.Document, ajv: Ajv): void => {
    this.validate = true;
    if (!openApiDoc || !ajv) {
      throw new Error('OpenApi document and Ajv instance required for path validation');
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

const makeValidator = (operationId: string, document: OpenAPIV3.Document, ajv: Ajv): ValidateFunction => {
  const operation = selectOperation(operationId, document.paths);
  if (!operation) {
    throw new Error(`provided operationId: ${operationId} is not in provided open api document`);
  }
  const reqSchema: OpenApiParameters = convertParametersToJSONSchema(
    operation?.parameters as OpenAPIV3.ParameterObject[],
  );
  const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
  if (!reqSchema.body) {
    reqSchema.body = requestBody.content['application/json'].schema;
  } else if (requestBody) {
    throw new Error('May only declare an operation request body in one location');
  }
  reqSchema.components = document.components;
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

export const onlyForTesting = { makeValidator, selectOperation };
