/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import express, { Request, Response } from 'express'
import { OpenAPIV3 } from 'openapi-types'
import { ExpressPathParser } from '../generator/expressParser'
import { path } from '../middleware/openApiPath'
test('support express nested sub-routes with parameters Router', (done) => {
    const successResponse = (req: Request, res: Response) => {
        res.status(204).send()
    }
    const app = express()
    const router = express.Router()
    const subrouter = express.Router()
    const router2 = express.Router();
    const subrouter2 = express.Router();
    const p: OpenAPIV3.OperationObject = {
        "description": "Returns pets based on ID",
        "summary": "Find pets by ID",
        "operationId": "getPetsById",
        "responses": {
            "200": {
                "description": "pet response",
                "content": {
                    "*/*": {
                        "schema": {
                            "type": "array",
                            "items": {
                                "$ref": "#/components/schemas/Pet"
                            }
                        }
                    }
                }
            },
            "default": {
                "description": "error payload",
                "content": {
                    "text/html": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorModel"
                        }
                    }
                }
            }
        }
    }
    const middle = path(p)
    subrouter.get('/endpoint', middle, successResponse)
    // subrouter.post('/endpoint2', successResponse)


    app.use('/sub-route/:test1', router)
    router.use('/sub-sub-route/:test2/:test3', subrouter)
    // app.use('/sub-route2', router2)
    // router2.use('/:test', subrouter2)
    // subrouter2.put('/:name/endpoint2/:id', successResponse)

    const parsed = new ExpressPathParser(app);
    console.log(parsed.appPaths)
    expect(parsed.appPaths[0].path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint')
    expect(parsed.appPaths[0].pathParams).toEqual([{ name: 'test1', in: 'path', required: true }, { name: 'test2', in: 'path', required: true }, { name: 'test3', in: 'path', required: true }])
    expect(parsed.appPaths[0].method).toBe('get')

    expect(parsed.appPaths[1].path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint2')
    expect(parsed.appPaths[1].pathParams).toEqual([{ name: 'test1', in: 'path', required: true }, { name: 'test2', in: 'path', required: true }, { name: 'test3', in: 'path', required: true }])
    expect(parsed.appPaths[1].method).toBe('post')

    expect(parsed.appPaths[2].path).toBe('/sub-route2/:test/:name/endpoint2/:id')
    expect(parsed.appPaths[2].pathParams).toEqual([{ name: 'test', in: 'path', required: true }, { name: 'name', in: 'path', required: true }, { name: 'id', in: 'path', required: true }])
    expect(parsed.appPaths[2].method).toBe('put')
    done()
})