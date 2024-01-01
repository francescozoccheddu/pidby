import { orThrow } from '@francescozoccheddu/ts-goodies/errors';
import { Info } from '@francescozoccheddu/ts-goodies/logs';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { readTextFile } from 'pidby/utils/file';
import { makeDialectProcessor } from 'pidby/utils/processDialect';

function parseYaml(_file: Str, code: Str): Json {
  return yaml.load(code, {
    schema: yaml.JSON_SCHEMA,
  }) as Json;
}

function parseJson(_file: Str, code: Str): Json {
  return JSON.parse(code) as Json;
}

enum JsonDialect {
  json = 'json', yaml = 'yaml'
}

const loader = makeDialectProcessor([
  {
    key: JsonDialect.json,
    extensions: ['json'],
    processor: parseJson,
  },
  {
    key: JsonDialect.yaml,
    extensions: ['yaml', 'yml'],
    processor: parseYaml,
  },
]);

export function loadJson(file: Str): Json {
  return orThrow(() => loader(file, readTextFile(file)), 'Failed to load JSON', { file });
}

export type JsonValidator<TValidJson extends RJson> = (obj: Unk) => TValidJson

export function createJsonValidator<TValidJson extends RJson>(schema: StrObj<RJson>): JsonValidator<TValidJson> {
  const validator = orThrow(() => {
    const ajv = new Ajv();
    return ajv.compile(schema);
  }, 'Failed to compile json schema');
  return (obj: Unk) => {
    if (!validator(obj)) {
      const errors: RArr<Info> = (validator.errors ?? []).map(error => ({
        message: error.message,
        property: error.propertyName,
        keyword: error.keyword,
        path: error.instancePath,
      }));
      err('Json validation failed', { errors });
    }
    return obj as TValidJson;
  };
}