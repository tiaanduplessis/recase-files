
# recase-files
[![package version](https://img.shields.io/npm/v/recase-files.svg?style=flat-square)](https://npmjs.org/package/recase-files)
[![package downloads](https://img.shields.io/npm/dm/recase-files.svg?style=flat-square)](https://npmjs.org/package/recase-files)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![package license](https://img.shields.io/npm/l/recase-files.svg?style=flat-square)](https://npmjs.org/package/recase-files)
[![make a pull request](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

> CLI utility to recase files matching a glob pattern

## Table of Contents

- [Usage](#usage)
- [Install](#install)
- [Contribute](#contribute)
- [License](#License)

## Usage

```bash
npx recase-files ./public/images/** -t kebab
```

Supported transforms are: `kebab`, `snake`, `train`, `pascal`, `camel`, `lower`, `upper`

Only each file's name is transformed; its directory and final extension are preserved.
For example, `Foo Bar/Foo Bar.txt` becomes `Foo Bar/foo-bar.txt` with `-t kebab`.

## Install

This project uses [node](https://nodejs.org) and [npm](https://www.npmjs.com). 

```sh
$ npm install --global recase-files
```

## Contribute

Run the dependency-free path regression tests with `npm test`.

The lockfile preserves the tested runtime dependencies, including `casey-js` 1.7.0;
[1.7.1 declares Node.js >=18](https://registry.npmjs.org/casey-js/1.7.1).
It makes repository installs reproducible, but is not included in published packages:
`npm install` and `npx` consumers still resolve the ranges in `package.json`.

This lockfile repair is not a security fix. The runtime graph still includes the
unresolved [braces nesting advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

1. Fork it and create your feature branch: `git checkout -b my-new-feature`
2. Commit your changes: `git commit -am "Add some feature"`
3. Push to the branch: `git push origin my-new-feature`
4. Submit a pull request

## License

MIT 
    