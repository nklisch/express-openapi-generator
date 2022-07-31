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
     * Sets defaults for the operation object when using the build interface
     *
     * @param defaults The defaults to set - these are global to the OperationBuilder class
     */
    public static defaults(defaults: OperationDefaults) {
        OperationBuilder._defaults = structuredClone(defaults);
    }
    /**
     * Start building a new Operation object
     *
     * @param responses The responses object - required by OpenApiv3
     * @returns OperationBuilder instances for method chaining
     */
    public static new(responses: OpenAPIV3.ResponsesObject) {
        return new OperationBuilder(responses);
    }

    private readonly _operation: OpenAPIV3.OperationObject;

    private constructor(responses: OpenAPIV3.ResponsesObject) {
        this._operation = { responses: structuredClone(responses), ...structuredClone(OperationBuilder._defaults) };
    }

    /**
     * Creates a deep copy of the current state of the operation and returns it.
     *
     * @returns A deep copy of the built operation object
     */
    public build(): OpenAPIV3.OperationObject {
        return structuredClone(this._operation);
    }

    /**
     * Add a tags field to the Operation object
     *
     * @param tags The tags object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public tags = (tags: string[]): OperationBuilder => {
        this._operation.tags = structuredClone(tags);
        return this;
    };

    /**
     * Add a summary field to the Operation object
     *
     * @param summary The summary string per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public summary = (summary: string): OperationBuilder => {
        this._operation.summary = summary;
        return this;
    };

    /**
     * Add a description field to the Operation object
     *
     * @param description The description string per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public description = (description: string): OperationBuilder => {
        this._operation.description = description;
        return this;
    };

    /**
     * Add a externalDocObject field to the Operation object
     *
     * @param externalDocObject The externalDocObject object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public externalDocs = (externalDocObject: OpenAPIV3.ExternalDocumentationObject): OperationBuilder => {
        this._operation.externalDocs = structuredClone(externalDocObject);
        return this;
    };

    /**
     * Add a operationId field to the Operation object.
     *
     * **Must be unique per document**
     *
     * @param operationId The operationId string per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public operationId = (operationId: string): OperationBuilder => {
        this._operation.operationId = operationId;
        return this;
    };

    /**
     * Add a parameters field to the Operation object.
     *
     * @param parameters The parameters object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public parameters = (parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]): OperationBuilder => {
        this._operation.parameters = structuredClone(parameters);
        return this;
    };

    /**
     * Add a requestBody field to the Operation object.
     *
     * @param requestBody The requestBody object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public requestBody = (requestBody: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject): OperationBuilder => {
        this._operation.requestBody = structuredClone(requestBody);
        return this;
    };

    /**
     * Add a callbacks field to the Operation object.
     *
     * @param callbacks The callbacks object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public callbacks = (callbacks: {
        [callback: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.CallbackObject;
    }): OperationBuilder => {
        this._operation.callbacks = structuredClone(callbacks);
        return this;
    };

    /**
     * Add a deprecated field to the Operation object.
     *
     * @param deprecated The deprecated boolean per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public deprecated = (deprecated: boolean): OperationBuilder => {
        this._operation.deprecated = deprecated;
        return this;
    };

    /**
     * Add a security field to the Operation object.
     *
     * @param security The security object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public security = (security: OpenAPIV3.SecurityRequirementObject[]): OperationBuilder => {
        this._operation.security = structuredClone(security);
        return this;
    };

    /**
     * Add a servers field to the Operation object.
     *
     * @param servers The servers object per OpenApiv3 spec
     * @returns OperationBuilder instances for method chaining
     */
    public servers = (servers: OpenAPIV3.ServerObject[]): OperationBuilder => {
        this._operation.servers = structuredClone(servers);
        return this;
    };
}
