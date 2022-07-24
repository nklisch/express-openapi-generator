/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Express } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { Key } from '../types';
import { ExpressPath, ExpressRegex, Layer, Router, OpenApiRequestHandler } from '../types';
export default class ExpressPathParser {
    private readonly _appPaths: ExpressPath[];
    public get appPaths(): ExpressPath[] {
        return this._appPaths;
    }

    constructor(app: Express) {
        this._appPaths = [];
        const router: Router = app._router || app.router;
        if (router) {
            router.stack.forEach((layer: Layer) => {
                this.traverse('', layer, []);
            });
        }
    }
    /**
     * Recursive traversal method for the express router and middleware tree.
     *
     * @param path The current path segment that we have traversed so far
     * @param layer The current 'layer' of the router tree
     * @param keys The keys for the parameter's in the current path branch of the traversal
     * @returns void - base case saves result to internal object
     */
    traverse = (path: string, layer: Layer, keys: Key[]): ExpressPath | undefined => {
        keys = [...keys, ...layer.keys];
        if (layer.handle?.name === 'openApiPathMiddleware') {
            throw new Error('openApiPathMiddleware must exist on the final route later')
        }
        if (layer.name === 'router' && layer.handle) {
            layer.handle.stack.forEach((l: Layer) => {
                path = path || '';
                this.traverse(`${path}/${pathRegexParser(layer.regexp, layer.keys)}`, l, keys);
            });
        }
        if (!layer.route || !layer.route.stack.length) {
            return;
        }
        this._appPaths.push(this.parseRouteLayer(layer, keys, path));
    };
    /**
     * Parses a route object. Route objects are the leafs of an express router tree
     *
     * @param layer The layer of this route object - represents the stack of middleware and other meta data
     * @param keys The full set of keys for this particular route
     * @param basePath The base path as it was initial declared for this route
     * @returns A ExpressPath object holding the meta data for a given route
     */
    parseRouteLayer = (layer: Layer, keys: Key[], basePath: string): ExpressPath => {
        const lastRequestHandler = layer.route.stack[layer.route.stack.length - 1];
        const params: OpenAPIV3.ParameterObject[] = keys.map((key) => {
            return { name: key.name, in: 'path', required: !key.optional };
        });
        let openApiDoc: OpenAPIV3.OperationObject | null = null;
        const filtered = layer.route.stack.filter((element) => element.name === 'openApiPathMiddleware');
        if (filtered.length === 1) {
            openApiDoc = filtered[0]?.handle?.pathDoc || null;
        } else if (filtered.length > 1) {
            throw Error(
                `At most one OpenApiPathMiddleware may be on a route: ${basePath + layer.route.path} has ${filtered.length}`,
            );
        }
        if (openApiDoc) {
            return {
                path: basePath + layer.route.path,
                pathParams: params,
                method: lastRequestHandler.method,
                openApiOperation: openApiDoc,
            };
        }
        return { path: basePath + layer.route.path, pathParams: params, method: lastRequestHandler.method };
    };
}

/** Parses an express layer's regex and converts it to the original format seen in code.
 *
 * @param layerRegexPath The layer's regex pattern
 * @param keys The keys that represent the layer's path parameters
 * @returns {string} The array of paths
 * Code inspired and modify from:
 * https://github.com/expressjs/express/issues/3308#issuecomment-300957572
 */
const pathRegexParser = (layerRegexPath: ExpressRegex | string, keys: Key[]): string => {
    if (typeof layerRegexPath === 'string') {
        return layerRegexPath;
    }
    if (layerRegexPath.fast_slash) {
        return '';
    }
    if (layerRegexPath.fast_star) {
        return '*';
    }
    let mappedPath = '';
    if (keys && keys.length) {
        mappedPath = mapKeysToPath(layerRegexPath, keys);
    }
    const match = layerRegexPath
        .toString()
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '$')
        .match(/^\/\^((?:\\[.*+?^${}()|[\]\\/]|[^.*+?^${}()|[\]\\/])*)\$\//) as string[];

    if (match) {
        return match[1].replace(/\\(.)/g, '$1').slice(1);
    }
    if (mappedPath) {
        return mappedPath.slice(1);
    }
    return layerRegexPath.toString()
};


/**
 * Map's the keys/path variables to the regex inside a given path
 *
 * @param layerRegexPath The regex for a react router with path parameters
 * @param keys The keys that represent the path parameters
 * @returns {string} The regex for a path variable converted to original string on the express route
 */
const mapKeysToPath = (layerRegexPath: ExpressRegex, keys: Key[]): string => {
    if (!keys || keys.length === 0) {
        throw Error('must include atleast one key to map');
    }
    let convertedSubPath = layerRegexPath.toString();
    for (const key of keys) {
        if (key.optional) {
            convertedSubPath = convertedSubPath.replace('(?:\\/([^\\/]+?))?\\', `/:${key.name}?`);
        } else {
            convertedSubPath = convertedSubPath.replace('(?:([^\\/]+?))', `:${key.name}`);
        }
    }
    return convertedSubPath
        .replace('/?(?=\\/|$)/i', '')
        .replace('/^', '')
        .replace(/\\/gi, '')
        .replace(/\/{2,}/gi, '/');
};

export const onlyForTesting = { pathRegexParser, mapKeysToPath };
