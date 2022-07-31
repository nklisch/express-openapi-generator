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
    private static _defaults?: OperationDefaults;
    /**
     *
     * @param defaults
     */
    public static defaults(defaults: OperationDefaults) {
        OperationBuilder._defaults = structuredClone(defaults);
    }
    /**
     *
     * @param responses
     * @returns
     */
    public static new(responses: OpenAPIV3.ResponsesObject) {
        return new OperationBuilder(responses);
    }

    private readonly _operation: OpenAPIV3.OperationObject;
    /**
     *
     * @param responses
     * @param defaults
     */

    private constructor(responses: OpenAPIV3.ResponsesObject) {
        this._operation = { responses: structuredClone(responses), ...structuredClone(OperationBuilder._defaults) };
    }

    /**
     *
     */
    public build(): OpenAPIV3.OperationObject {
        return structuredClone(this._operation);
    }

    /**
     *
     * @param tags
     * @returns
     */
    public tags = (tags: string[]) => {
        this._operation.tags = structuredClone(tags);
        return this;
    };

    /**
     *
     * @param summary
     * @returns
     */
    public summary = (summary: string) => {
        this._operation.summary = summary;
        return this;
    };

    /**
     *
     * @param description
     * @returns
     */
    public description = (description: string) => {
        this._operation.description = description;
        return this;
    };

    /**
     *
     * @param externalDocObject
     * @returns
     */
    public externalDocs = (externalDocObject: OpenAPIV3.ExternalDocumentationObject) => {
        this._operation.externalDocs = structuredClone(externalDocObject);
        return this;
    };

    /**
     *
     * @param operationId
     * @returns
     */
    public operationId = (operationId: string) => {
        this._operation.operationId = operationId;
        return this;
    };

    /**
     *
     * @param parameters
     * @returns
     */
    public parameters = (parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]) => {
        this._operation.parameters = structuredClone(parameters);
        return this;
    };

    /**
     *
     * @param requestBody
     * @returns
     */
    public requestBody = (requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject) => {
        this._operation.requestBody = structuredClone(requestBody);
        return this;
    };

    /**
     *
     * @param callbacks
     * @returns
     */
    public callbacks = (callbacks: { [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject }) => {
        this._operation.callbacks = structuredClone(callbacks);
        return this;
    };

    /**
     *
     * @param deprecated
     * @returns
     */
    public deprecated = (deprecated: boolean) => {
        this._operation.deprecated = deprecated;
        return this;
    };

    /**
     *
     * @param security
     * @returns
     */
    public security = (security: OpenAPIV3.SecurityRequirementObject[]) => {
        this._operation.security = structuredClone(security);
        return this;
    };

    /**
     *
     * @param servers
     * @returns
     */
    public servers = (servers: OpenAPIV3.ServerObject[]) => {
        this._operation.servers = structuredClone(servers);
        return this;
    };
}
