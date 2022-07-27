/* eslint-disable no-underscore-dangle */
import { OpenAPIV3 } from 'openapi-types';

export type OperationDefaults = {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocObject?: OpenAPIV3.ExternalDocumentationObject;
  operationId?: string;
  parameters?: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[];
  requestBody?: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject;
  callbacks?: { [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject };
  deprecated?: boolean;
};

export default class OperationBuilder {
  private readonly _operation: OpenAPIV3.OperationObject;
  constructor(responses: OpenAPIV3.ResponsesObject, defaults?: OperationDefaults) {
    this._operation = { responses: structuredClone(responses), ...structuredClone(defaults) };
  }

  public get operationObject(): OpenAPIV3.OperationObject {
    return structuredClone(this._operation);
  }
  public tags = (tags: string[]) => {
    this._operation.tags = structuredClone(tags);
    return this;
  };
  public summary = (summary: string) => {
    this._operation.summary = summary;
    return this;
  };

  public description = (description: string) => {
    this._operation.description = description;
    return this;
  };

  public externalDocs = (externalDocObject: OpenAPIV3.ExternalDocumentationObject) => {
    this._operation.externalDocs = structuredClone(externalDocObject);
    return this;
  };

  public operationId = (operationId: string) => {
    this._operation.operationId = operationId;
    return this;
  };

  public parameters = (parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]) => {
    this._operation.parameters = structuredClone(parameters);
    return this;
  };

  public requestBody = (requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject) => {
    this._operation.requestBody = structuredClone(requestBody);
    return this;
  };

  public callbacks = (callbacks: { [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject }) => {
    this._operation.callbacks = structuredClone(callbacks);
    return this;
  };

  public deprecated = (deprecated: boolean) => {
    this._operation.deprecated = deprecated;
    return this;
  };

  public security = (security: OpenAPIV3.SecurityRequirementObject[]) => {
    this._operation.security = structuredClone(security);
    return this;
  };

  public servers = (servers: OpenAPIV3.ServerObject[]) => {
    this._operation.servers = structuredClone(servers);
    return this;
  };
}
