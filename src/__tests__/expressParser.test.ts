/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import express, { Request, Response } from 'express'
import ExpressPathParser, { OnlyForTesting } from '../generator/expressParser'
import { ExpressRegex } from '../types/express'

const staticPath = /^\/sub-route2\/?(?=\/|$)/i as ExpressRegex
const oneDynamicPath = () => {
    return { regex: /^\/sub-route\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex, keys: [
        {
            name: "test1",
            optional: false,
            offset: 12,
        },
    ]
}}
const twoDynamicPaths = () => {
    return { regex: /^\/sub-sub-route(?:\/([^\/]+?))?\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex, keys: [
        {
            name: "test2",
            optional: false,
            offset: 16,
        },
        {
            name: "test3",
            optional: false,
            offset: 31,
        },
    ]
}}

describe('mapKeysToPath: maps keys to path', () => {
    it('handles one dynamic path parameter', () => {
        expect(OnlyForTesting.mapKeysToPath(oneDynamicPath().regex, oneDynamicPath().keys)).toBe('/sub-route/:test1')
    })
    it('handles two dynamic path parametes', () => {
        expect(OnlyForTesting.mapKeysToPath(twoDynamicPaths().regex, twoDynamicPaths().keys)).toBe('/sub-sub-route/:test2/:test3')
    })
    it('handles empty keys', () => {
        expect(() => OnlyForTesting.mapKeysToPath(staticPath, [])).toThrow()
    })
    it('handles optional parametes', () =>{
            const optional = twoDynamicPaths()
            optional.regex = /^\/sub-sub-route\/(?:([^\/]+?))\/(?:([^\/]+?))\/?(?=\/|$)/i as ExpressRegex
            optional.keys[0].optional = true
            expect(OnlyForTesting.mapKeysToPath(optional.regex, optional.keys )).toBe('/sub-sub-route/:test2?/:test3')
    })
})

describe('pathRegexParser: converts regex to path', () => {
    
    it('handles static regex route', () =>{
        expect(OnlyForTesting.pathRegexParser(staticPath, [])).toBe('sub-route2')
    })
    it('handles one dynamic path parameters', () =>{
        expect(OnlyForTesting.pathRegexParser(oneDynamicPath().regex, oneDynamicPath().keys)).toBe('sub-route/:test1')
    })
    it('handles two dynamic path parameters', () => {
        expect(OnlyForTesting.pathRegexParser(twoDynamicPaths().regex, twoDynamicPaths().keys)).toBe('sub-sub-route/:test2/:test3')
    })
    it('handles normal string', () => {
        expect(OnlyForTesting.pathRegexParser('testing/test', [])).toBe('testing/test')
    })
    it('handles fast slash', () => {
        const fastSlash:any = /test/
        fastSlash.fast_slash = true
        fastSlash.fast_star = false
        expect(OnlyForTesting.pathRegexParser(fastSlash, [])).toBe('')
    })
    it('handles fast star', () =>{
        const fastStar:any = /test/
        fastStar.fast_slash = false
        fastStar.fast_star = true
        expect(OnlyForTesting.pathRegexParser(fastStar, [])).toBe('*')
    })
    it('handles custom regex path', () =>{
        expect(OnlyForTesting.pathRegexParser(/test/ as ExpressRegex, [])).toBe(' /test/ ')
    })
})


it('supports express nested sub-routes with parameters Router', (done) => {
    const successResponse = (req: Request, res: Response) => {
        res.status(204).send()
    }
    const app = express()
    const router = express.Router()
    const subrouter = express.Router()
    const router2 = express.Router();
    const subrouter2 = express.Router();


    subrouter.get('/endpoint', successResponse)
    subrouter.post('/endpoint2', successResponse)


    app.use('/sub-route/:test1', router)
    router.use('/sub-sub-route/:test2?/:test3', subrouter)
    app.use('/sub-route2', router2)
    router2.use('/:test/qualifier', subrouter2)
    subrouter2.put('/:name/endpoint2/:id', successResponse)
    // 

    const parsed = new ExpressPathParser(app);
    expect(parsed.appPaths[0].path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint')
    expect(parsed.appPaths[0].pathParams).toEqual([{ name: 'test1', in: 'path', required: true }, { name: 'test2', in: 'path', required: true }, { name: 'test3', in: 'path', required: true }])
    expect(parsed.appPaths[0].method).toBe('get')

    expect(parsed.appPaths[1].path).toBe('/sub-route/:test1/sub-sub-route/:test2/:test3/endpoint2')
    expect(parsed.appPaths[1].pathParams).toEqual([{ name: 'test1', in: 'path', required: true }, { name: 'test2', in: 'path', required: true }, { name: 'test3', in: 'path', required: true }])
    expect(parsed.appPaths[1].method).toBe('post')

    expect(parsed.appPaths[2].path).toBe('/sub-route2/:test/qualifier/:name/endpoint2/:id')
    expect(parsed.appPaths[2].pathParams).toEqual([{ name: 'test', in: 'path', required: true }, { name: 'name', in: 'path', required: true }, { name: 'id', in: 'path', required: true }])
    expect(parsed.appPaths[2].method).toBe('put')
    done()
})

