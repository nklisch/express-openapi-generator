# express-openapi-generator
This package is unopinionated and made of a independent tools that can be used in unison to analyze an Express app project and generate OpenApi v3 documentation.

*Inspired by [@wesleytodd/express-openapi](https://www.npmjs.com/package/@wesleytodd/openapi). No active development is happening on `@wesleytodd/express-openapi`, and there are some bugs. This project seeks to use the same philosophy of documentation from code, but provide a less opinionated interface and provide improved features and  better express app structure support.*
### Features
- **Express Parser**: Parses an express app and creates a list of routes with relevant meta-data attached. Supports multiple nested routers with path parameters, complex routes, multi-page router apps.
- **Express OpenApi Middleware**: Creates an Express middleware that attaches relevant meta-data to an individual route. Also provides optional request validation when given a complete open api specification.
- **OpenApi-Builder**: Provides interface to parse the output of the Express Parser to generate OpenApi Path objects. Also helps generate a full OpenApi v3 specification json document.

## Installation

## Usage

### Notes
singleton patterns

### Peer Dependencies
These packages are required for certain functionality: 
- [ajv](https://www.npmjs.com/package/ajv): *Required* package for the provided validation structure. It is not a package dependency, instead build a Ajv instance for use with the validator. This allows direct customization of the Ajv client.
### Recommended npm packages
These packages may integrate well into this eco-system/philosophy of documentation/validation generated from code. 
https://www.npmjs.com/package/openapi-schema-validator
*This package has no direct affiliation with any of these packages.*
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express): provides a web-served GUI for Swagger UI. 
- [redoc-express](https://www.npmjs.com/package/redoc-express): provides a web-served GUI for Redoc UI.
- [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator): Use instead of provided validation flow and Ajv. This provides validation for your routes based on the generated open api spec. Can be used instead of included validation flow. Ajv is not a direct dependency of this project.
- [typescript-json-schema](https://www.npmjs.com/package/express-openapi-validator): Generate json-schema's for your typescript models. Can be used with openapi/jsonschema conversion packages.
- [prisma-json-schema-generator](https://www.npmjs.com/package/prisma-json-schema-generator): Generate json schema's based on your prisma schema.
- [openapi-client-axios](https://www.npmjs.com/package/openapi-client-axios): Generates an axios client based on an open-api spec
## API Documentation

### express-parser
### express-openapi-middleware
### openapi-builder
