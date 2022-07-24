/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenAPIV3 } from "openapi-types";
import { ExpressPath } from "../types";

export class OpenApiDocument {
    private readonly _document: OpenAPIV3.Document;
    public get document(): OpenAPIV3.Document {
        return deepCopy(this._document) as OpenAPIV3.Document;
    }
    constructor({ expressParserOutput, openApiDoc, requireOpenApiDocs = false, includeExcludedPaths = false }: { expressParserOutput: ExpressPath[], openApiDoc: OpenAPIV3.Document, requireOpenApiDocs?: boolean, includeExcludedPaths?: boolean }) {
        openApiDoc = deepCopy(openApiDoc) as OpenAPIV3.Document;
        verifyBasicOpenApiReqs(openApiDoc);
        openApiDoc.paths = buildPathsObject(expressParserOutput, requireOpenApiDocs, includeExcludedPaths);
        this._document = openApiDoc
    }
}

const deepCopy = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj))
}

const verifyBasicOpenApiReqs = (openApiDoc: OpenAPIV3.Document) => {
    let missingFields = openApiDoc?.openapi ? '' : 'openapi, ';
    missingFields += openApiDoc?.info?.title ? '' : 'info, title, ';
    missingFields += openApiDoc?.info?.version ? '' : 'and version.';
    if (missingFields) {
        throw new Error('Provided Open Api stub document is missing the following fields: ' + missingFields);
    }
}

const buildPathsObject = (expressParserOutput: ExpressPath[], requireOpenApiDocs: boolean, includeExcludedPaths: boolean): OpenAPIV3.PathsObject => {
    const paths: any = {}
    for (const path of expressParserOutput) {
        const excludeThisPath = (path.exclude && !includeExcludedPaths) || (requireOpenApiDocs && !path.openApiOperation);
        if (excludeThisPath) {
            continue;
        }
        transformExpressPathToOpenApi(path);
        paths[path.path] = {};
        paths[path.path][path.method] = {};
        let parameters = path.openApiOperation?.parameters || [] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[];
        mergeParameters(parameters, path);
        parameters = [...path.pathParams, ...parameters]
        paths[path.path][path.method] = parameters;
    }
    return paths as OpenAPIV3.PathsObject;
}

const transformExpressPathToOpenApi = (path: ExpressPath) => {
    path.pathParams.forEach((param: OpenAPIV3.ParameterObject) => {
        path.path = path.path.replace(`:${param.name}`, `{${param.name}}`);
    })
}

const mergeParameters = (parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[], path: ExpressPath) => {
    for (let i = 0; i < parameters.length; i++) {
        for (let j = 0; j < path.pathParams.length; j++) {
            if (parameters[i] === path.pathParams[j]) {
                parameters[i] = Object.assign(path.pathParams[i], parameters[i]);
                path.pathParams = path.pathParams.splice(i, 1);
            }
        }
    }
}
