/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-underscore-dangle */

import { OpenAPIV3 } from 'openapi-types';
import { ComponentFieldNames, CompositeSchemaTypes, Component, ComponentParameter } from '../types';
import { Parameter, parseExpressApp } from 'express-route-parser';
import { RouteMetaData } from '../types';
import { Express } from 'express';
export default class OpenApiDocumentBuilder {
    private static instance?: OpenApiDocumentBuilder;
    private readonly _document: OpenAPIV3.Document;
    private readonly components: Map<string, Component>;

    private constructor(documentStub: OpenAPIV3.Document) {
        documentStub = structuredClone(documentStub);
        const missingFields = verifyBasicOpenApiReqs(documentStub);
        if (missingFields) {
            throw new Error('Provided Open Api stub document is missing the following fields: ' + missingFields);
        }
        this._document = documentStub;
        this.components = new Map<string, Component>();
        this.processComponents();
    }
    /**
     *
     */
    public static deleteDocumentInstance() {
        if (OpenApiDocumentBuilder.instance) {
            delete OpenApiDocumentBuilder.instance;
        }
    }

    /**
     *
     * @param documentStub
     * @param reinitialize
     * @returns
     */
    public static initializeDocument(documentStub: OpenAPIV3.Document, reinitialize = false): OpenApiDocumentBuilder {
        if (!OpenApiDocumentBuilder.instance || reinitialize) {
            OpenApiDocumentBuilder.instance = new OpenApiDocumentBuilder(documentStub);
        }
        return OpenApiDocumentBuilder.instance;
    }

    public static get documentBuilder(): OpenApiDocumentBuilder {
        if (!OpenApiDocumentBuilder.instance) {
            throw new Error('Must initialize document before getting builder instance');
        }
        return OpenApiDocumentBuilder.instance;
    }
    /**
     *
     * @param expressParserOutput
     * @param requireOpenApiDocs
     * @param includeExcludedPaths
     */
    public addPathsObject(app: Express, requireOpenApiDocs = false, includeExcludedPaths = false): void {
        this._document.paths = this.buildPaths(app, requireOpenApiDocs, includeExcludedPaths);
    }
    /**
     *
     * @returns
     */
    public build(): OpenAPIV3.Document {
        return structuredClone(this._document);
    }

    private processComponents() {
        if (!this._document.components) {
            return;
        }
        for (const [field, components] of Object.entries(this._document.components)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            for (const [name, component] of Object.entries(components)) {
                this.component(field as ComponentFieldNames, name, { component: component as Component });
            }
        }
    }
    /**
     *
     * @param names
     * @returns
     */
    public allOf = (names: string[]) => {
        return this.compositeSchema(CompositeSchemaTypes.allOf, names);
    };
    /**
     *
     * @param names
     * @returns
     */
    public oneOf = (names: string[]) => {
        return this.compositeSchema(CompositeSchemaTypes.oneOf, names);
    };
    /**
     *
     * @param names
     * @returns
     */
    public anyOf = (names: string[]) => {
        return this.compositeSchema(CompositeSchemaTypes.anyOf, names);
    };
    /**
     *
     * @param type
     * @param names
     * @returns
     */
    public compositeSchema = (type: CompositeSchemaTypes, names: string[]): OpenAPIV3.SchemaObject => {
        const composite: any = {};
        composite[type] = names.map((name) => {
            const ref = this.schema(name);
            if (!ref) {
                throw new Error(`Provided component name ${name} does not exist on the document`);
            }
            return ref;
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return composite as OpenAPIV3.SchemaObject;
    };
    /**
     *
     * @param field
     * @param name
     * @param params
     * @returns
     */
    public component = (
        field: ComponentFieldNames,
        name: string,
        params?: ComponentParameter,
    ): Component | OpenAPIV3.ReferenceObject | undefined => {
        if (!Object.values(ComponentFieldNames).includes(field)) {
            throw new Error(
                `Provided component fields - ${field} - is invalid, must be one of: ${Object.values(
                    ComponentFieldNames,
                ).toString()}`,
            );
        }
        if (params?.component) {
            if (!this._document.components) {
                this._document.components = {};
            }
            if (!this._document.components[field]) {
                this._document.components[field] = {};
            }
            params.component = structuredClone(params.component);
            this.components.set(`${field}-${name}`, params.component);
            (this._document.components as any)[field][name] = params.component;
        }
        const key = `${field}-${name}`;
        if (!this.components.has(key)) {
            return undefined;
        }
        return params?.copy ? structuredClone(this.components.get(key)) : { $ref: `#/components/${field}/${name}` };
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public schema = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.schemas, name, params) as
            | OpenAPIV3.SchemaObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public response = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ResponseObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.responses, name, params) as
            | OpenAPIV3.ResponseObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public parameter = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.parameters, name, params) as
            | OpenAPIV3.ParameterObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public example = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.ExampleObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.examples, name, params) as
            | OpenAPIV3.ExampleObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public requestBody = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.requestBodies, name, params) as
            | OpenAPIV3.RequestBodyObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public header = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.headers, name, params) as
            | OpenAPIV3.HeaderObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public securityScheme = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.securitySchemes, name, params) as
            | OpenAPIV3.SecuritySchemeObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public link = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.LinkObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.links, name, params) as
            | OpenAPIV3.LinkObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };
    /**
     *
     * @param name
     * @param params
     * @returns
     */
    public callback = (
        name: string,
        params?: ComponentParameter,
    ): OpenAPIV3.CallbackObject | OpenAPIV3.ReferenceObject | undefined => {
        return this.component(ComponentFieldNames.callbacks, name, params) as
            | OpenAPIV3.CallbackObject
            | OpenAPIV3.ReferenceObject
            | undefined;
    };

    private buildPaths = (
        app: Express,
        requireOpenApiDocs: boolean,
        includeExcludedPaths: boolean,
    ): OpenAPIV3.PathsObject => {
        const expressParserOutput: RouteMetaData[] = parseExpressApp(app);
        const paths: any = {};
        for (const path of expressParserOutput) {
            const excludeThisPath =
                (path?.metadata?.exclude && !includeExcludedPaths) ||
                (requireOpenApiDocs && !path?.metadata?.operationObject);
            if (excludeThisPath) {
                continue;
            }
            transformExpressPathToOpenApi(path);
            if (!paths[path.path]) {
                paths[path.path] = {};
            }
            paths[path.path][path.method] = path?.metadata?.operationObject || {};
            if (path?.metadata?.operationId) {
                paths[path.path][path.method].operationId = path?.metadata?.operationId;
            }
            let parameters =
                (path?.metadata?.operationObject?.parameters as (
                    | OpenAPIV3.ReferenceObject
                    | OpenAPIV3.ParameterObject
                )[]) || ([] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]);
            parameters = this.mergeParameters(parameters, path);
            if (parameters.length > 0) {
                paths[path.path][path.method].parameters = parameters;
            }

            if (!paths[path.path][path.method].responses) {
                paths[path.path][path.method].responses = {
                    default: { description: 'Responses object not provided for this route' },
                };
            }
        }
        return paths as OpenAPIV3.PathsObject;
    };

    private mergeParameters = (
        parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
        path: RouteMetaData,
    ): (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[] => {
        for (let i = 0; i < parameters.length; i++) {
            for (let j = 0; j < path.pathParams.length; j++) {
                if ((parameters[i] as OpenAPIV3.ReferenceObject).$ref) {
                    parameters[i] = this.parameter((parameters[i] as OpenAPIV3.ReferenceObject).$ref.split('/')[3], {
                        copy: true,
                    }) as OpenAPIV3.ParameterObject;
                }
                if ((parameters[i] as OpenAPIV3.ParameterObject)?.name === path.pathParams[j].name) {
                    parameters[i] = Object.assign(path.pathParams[j], parameters[i]) as
                        | OpenAPIV3.ReferenceObject
                        | OpenAPIV3.ParameterObject;
                    path.pathParams.splice(j, 1);
                    break;
                }
            }
        }
        return [...parameters, ...(path.pathParams as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[])] as (
            | OpenAPIV3.ParameterObject
            | OpenAPIV3.ReferenceObject
        )[];
    };
}

const verifyBasicOpenApiReqs = (openApiDoc: OpenAPIV3.Document): string => {
    let missingFields = openApiDoc?.openapi ? '' : 'openapi, ';
    missingFields += openApiDoc?.info ? '' : 'info, ';
    missingFields += openApiDoc?.info?.title ? '' : 'title ';
    missingFields += openApiDoc?.info?.version ? '' : 'and version.';
    return missingFields;
};

const transformExpressPathToOpenApi = (path: RouteMetaData): void => {
    path.pathParams.forEach((param: Parameter) => {
        path.path = path.path.replace(`:${param.name}`, `{${param.name}}`);
    });
};

export const onlyForTesting = {
    verifyBasicOpenApiReqs,
    transformExpressPathToOpenApi,
};
