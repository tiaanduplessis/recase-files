
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

## Install

This project uses [node](https://nodejs.org) and [npm](https://www.npmjs.com). 

```sh
$ npm install --global recase-files
```

## Contribute

1. Fork it and create your feature branch: `git checkout -b my-new-feature`
2. Commit your changes: `git commit -am "Add some feature"`
3. Push to the branch: `git push origin my-new-feature`
4. Submit a pull request

## License

MIT 
    