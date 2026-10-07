#!/usr/bin/env node
const path = require('path')
const fs = require('fs/promises')

const globby = require('globby')
const args = require('get-them-args')()
const casey = require('casey-js')

const pkg = require('./package.json')

const transformers = {
  kebab: casey.toKebabCase,
  snake: casey.toSnakeCase,
  train: casey.toTrainCase,
  pascal: casey.toPascalCase,
  camel: casey.toCamelCase,
  lower: casey.toLowerCase,
  upper: casey.toUpperCase
};

(async () => {
  if (args.version) {
    console.log(pkg.version)
    return
  }

  if (!args.transform && !args.t) {
    throw new Error(`Please select a transform to apply (${Object.keys(transformers).join(', ')})`)
  }

  const paths = await globby(args.unknown)
  const transform = transformers[args.transform || args.t]

  await Promise.all(paths.map(async current => {
    const { root, dir, name, ext } = path.parse(current)
    const transformedName = transform(name)
    return fs.rename(current, path.format({ root, dir, name: transformedName, ext }))
  }))
})()
