/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */


import { Express } from 'express'
import { OpenAPIV3 } from 'openapi-types'
import { Key } from '../types/express'
import { ExpressPath, ExpressRegex, Layer, Router } from '../types/express'
export class ExpressPathParser {
    private readonly _appPaths: ExpressPath[]
    public get appPaths(): ExpressPath[] {
        return this._appPaths
    }

    constructor(app: Express) {
        this._appPaths = []
        const router: Router = app._router || app.router;
        if (router) {
            router.stack.forEach((layer: Layer) => {
                this.traverse('', layer, [])
            });
        }
    }
    /**
     * 
     * @param path 
     * @param layer 
     * @param keys 
     * @returns 
     */
    private traverse = (path: string, layer: Layer, keys: Key[]): void => {
        keys = [...keys, ...layer.keys]
        if (layer.name === 'router' && layer.handle) {
            layer.handle.stack.forEach((l: Layer) => {
                path = path || ''
                this.traverse(`${path}/${this.pathRegexParser(layer.regexp, layer.keys)}`, l, keys)
            })
        }
        if (!layer.route || !layer.route.stack.length) {
            return
        }
        this.parseRouteLayer(layer, keys, path)

    }

    private parseRouteLayer(layer: Layer, keys: Key[], path: string) {
        const lastRequestHandler = layer.route.stack[layer.route.stack.length - 1]
        const params: OpenAPIV3.ParameterObject[] = keys.map((key) => {
            return { name: key.name, in: 'path', required: true }
        })
        let openApiDoc: OpenAPIV3.OperationObject | null = null;
        const filtered = layer.route.stack.filter(element => element.name === 'openApiPathMiddleware')
        if (filtered.length === 1) {
            openApiDoc = filtered[0]?.handle?.pathDoc || null
        } else if (filtered.length > 1) {
            throw Error(`At most one OpenApiPathMiddleware may be on a route: ${path + layer.route.path} has ${filtered.length}`)
        }
        if (openApiDoc) {
            this.appPaths.push({ path: path + layer.route.path, pathParams: params, method: lastRequestHandler.method, openApiOperation: openApiDoc })
            return
        }
        this.appPaths.push({ path: path + layer.route.path, pathParams: params, method: lastRequestHandler.method })
    }


    /** Parses an express layer's regex and converts it to the original format seen in code.
     *
     * @param {ExpressRegex | string} layerRegexPath The layer's regex pattern
     * @param {Key[]} keys The keys that represent the layer's path parameters
     * @returns {string[]} The array of paths
     * Code inspired and modify from:
     * https://github.com/expressjs/express/issues/3308#issuecomment-300957572                   
     */
    private pathRegexParser = (layerRegexPath: ExpressRegex | string, keys: Key[]): string => {
        if (typeof layerRegexPath === 'string') {
            return layerRegexPath
        }
        if (layerRegexPath.fast_slash) {
            return ''
        }
        if (layerRegexPath.fast_star) {
            return '*'
        }
        let mappedPath = '';
        if (keys && keys.length) {
            mappedPath = this.mapKeysToPath(layerRegexPath, keys)
        }
        const match = layerRegexPath
            .toString()
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '$')
            .match(/^\/\^((?:\\[.*+?^${}()|[\]\\/]|[^.*+?^${}()|[\]\\/])*)\$\//) as string[]

        if (match) {
            return match[1].replace(/\\(.)/g, '$1').slice(1)
        }
        if (mappedPath) {
            return mappedPath.slice(1)
        }
        return ` ${layerRegexPath.toString()} `;

    }



    private mapKeysToPath(layerRegexPath: ExpressRegex, keys: Key[]) {
        let convertedSubPath = layerRegexPath.toString()
        for (const key of keys) {
            if (key.optional) {
                convertedSubPath = convertedSubPath.replace('(?:\\/([^\\/]+?))?\\', `/:${key.name}?`)

            } else {
                convertedSubPath = convertedSubPath.replace('(?:([^\\/]+?))', `:${key.name}`)
            }

        }
        return convertedSubPath.replace('/?(?=\\/|$)/i', '').replace('/^', '').replace(/\\/gi, '').replace(/\/{2,}/gi, '/')
    }
}
