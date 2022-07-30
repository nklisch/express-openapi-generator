/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { onlyForTesting } from '../express-openapi-middleware';
import swaggerEx from '../../resources/swaggerio-example.json';
import { OpenAPIV3 } from 'openapi-types';
import { PathMiddleware } from '../index';
import Ajv from 'ajv';
import { Request, Response } from 'express';

test('selectOperation selects correct operation', () => {
    expect(onlyForTesting.selectOperation('getUserByName', swaggerEx.paths as OpenAPIV3.PathsObject)).toEqual(
        swaggerEx.paths['/2.0/users/{username}'].get,
    );
});

test('selectOperation returns undefined ', () => {
    expect(onlyForTesting.selectOperation('testingUndefined', swaggerEx.paths as OpenAPIV3.PathsObject)).toEqual(
        undefined,
    );
});

test('makeValidator', () => {
    const ajv = new Ajv();
    const request = { params: { username: 'nathan' }, headers: {}, query: {} };
    const validate = onlyForTesting.makeValidator('getUserByName', swaggerEx as OpenAPIV3.Document, ajv);
    expect(validate(request)).toBe(true);
});

test('path middleware is correctly created', () => {
    const path: any = PathMiddleware.path('test', {
        operationObject: swaggerEx.paths['/2.0/users/{username}'].get as OpenAPIV3.OperationObject,
    });
    expect(path.metadata.operationId).toBe('test');
    expect(path.metadata.operationObject).toEqual(swaggerEx.paths['/2.0/users/{username}'].get);
    expect(path.metadata.exclude).toBe(false);
    path({} as Request, {} as Response, () => {
        return;
    });
});
