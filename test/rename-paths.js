const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')

// Exercise the CLI's own code without installing dependencies or scanning user files.
const entry = process.env.RECASE_FILES_TEST_ENTRY || path.join(__dirname, '..', 'index.js')
const source = fs.readFileSync(entry, 'utf8')
const pkg = require('../package.json')
const tests = []
const methods = {
  kebab: 'toKebabCase',
  snake: 'toSnakeCase',
  train: 'toTrainCase',
  pascal: 'toPascalCase',
  camel: 'toCamelCase',
  lower: 'toLowerCase',
  upper: 'toUpperCase'
}

function test (name, run) {
  tests.push({ name, run })
}

async function run (options) {
  const args = options.args || { t: 'kebab', unknown: ['fixture/**'] }
  const logs = []
  const calls = []
  const casey = {}
  Object.keys(methods).forEach(transform => {
    casey[methods[transform]] = name => {
      calls.push({ transform, name })
      return options.transformedName || 'renamed'
    }
  })
  const dependencies = {
    path: options.path || path,
    'fs/promises': { rename: options.rename },
    globby: async patterns => {
      assert.strictEqual(patterns, args.unknown)
      return options.paths || []
    },
    'get-them-args': () => args,
    'casey-js': casey,
    './package.json': pkg
  }
  await vm.runInNewContext(source, {
    require: name => {
      assert(Object.prototype.hasOwnProperty.call(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    console: { log: value => logs.push(value) }
  }, { filename: entry })
  return { logs, calls }
}

async function fixture (check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'recase-files-'))
  function resolve (filename) {
    const result = path.resolve(root, filename)
    const relative = path.relative(root, result)
    assert(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'Path escaped fixture')
    return result
  }
  function write (filename, contents) {
    const target = resolve(filename)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, contents)
  }
  try {
    await check({
      root,
      write,
      read: filename => fs.readFileSync(resolve(filename), 'utf8'),
      exists: filename => fs.existsSync(resolve(filename)),
      rename: (from, to) => fs.promises.rename(resolve(from), resolve(to))
    })
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const cases = [
  ['plain filename', 'Foo Bar.txt', 'foo-bar.txt', 'foo-bar'],
  ['relative prefix', './Foo Bar.txt', './foo-bar.txt', 'foo-bar'],
  ['nested directory', 'Images/Foo Bar.txt', 'Images/foo-bar.txt', 'foo-bar'],
  ['repeated directory name', 'Foo Bar/Foo Bar.txt', 'Foo Bar/foo-bar.txt', 'foo-bar', 'foo-bar/Foo Bar.txt'],
  ['repeated nested name', 'Foo Bar/Foo Bar/Foo Bar.txt', 'Foo Bar/Foo Bar/foo-bar.txt', 'foo-bar', 'foo-bar/Foo Bar/Foo Bar.txt'],
  ['name within directory', 'Foo Bar Archive/Foo Bar.txt', 'Foo Bar Archive/foo-bar.txt', 'foo-bar', 'foo-bar Archive/Foo Bar.txt'],
  ['multiple dots', 'Foo Bar.test/Foo Bar.test.JS', 'Foo Bar.test/foo-bar-test.JS', 'foo-bar-test', 'foo-bar-test/Foo Bar.test.JS'],
  ['no extension', 'Foo Bar/Foo Bar', 'Foo Bar/foo-bar', 'foo-bar', 'foo-bar/Foo Bar'],
  ['dotfile', '.Foo Bar/.Foo Bar', '.Foo Bar/.foo-bar', '.foo-bar', '.foo-bar/.Foo Bar'],
  ['dotfile with extension', '.Foo Bar/.Foo Bar.JSON', '.Foo Bar/.foo-bar.JSON', '.foo-bar', '.foo-bar/.Foo Bar.JSON'],
  ['unchanged name', 'same/same.txt', 'same/same.txt', 'same']
]

for (const [label, from, to, transformedName, wrongTarget] of cases) {
  for (const absolute of [false, true]) {
    test(`${label} (${absolute ? 'absolute' : 'relative'})`, () => fixture(async files => {
      files.write(from, 'source contents')
      if (wrongTarget) files.write(wrongTarget, 'sentinel: do not overwrite')
      const current = absolute ? path.join(files.root, from) : from
      const result = await run({ paths: [current], transformedName, rename: files.rename })
      assert.strictEqual(files.read(to), 'source contents')
      if (from !== to && path.resolve(from) !== path.resolve(to)) assert.strictEqual(files.exists(from), false)
      if (wrongTarget) assert.strictEqual(files.read(wrongTarget), 'sentinel: do not overwrite')
      assert.deepStrictEqual(result.calls, [{ transform: 'kebab', name: path.parse(from).name }])
      assert.deepStrictEqual(result.logs, [])
    }))
  }
}

test('repeated parent without a wrong-target directory', () => fixture(async files => {
  const from = 'Foo Bar/Foo Bar.txt'
  files.write(from, 'source contents')
  await run({ paths: [from], transformedName: 'foo-bar', rename: files.rename })
  assert.strictEqual(files.read('Foo Bar/foo-bar.txt'), 'source contents')
  assert.strictEqual(files.exists('foo-bar'), false)
}))

for (const transform of Object.keys(methods)) {
  test(`${transform} dispatches only the basename`, async () => {
    const renames = []
    const result = await run({
      args: { transform, unknown: ['fixture/**'] },
      paths: ['Original Name/Original Name.TXT'],
      rename: async (from, to) => renames.push([from, to])
    })
    assert.deepStrictEqual(result.calls, [{ transform, name: 'Original Name' }])
    assert.deepStrictEqual(renames, [['Original Name/Original Name.TXT', 'Original Name/renamed.TXT']])
  })
}

for (const from of ['C:\\Foo Bar\\Foo Bar.txt', 'C:\\Foo Bar.txt', '\\\\server\\Foo Bar\\Foo Bar.txt', 'Foo Bar\\Foo Bar.txt']) {
  test(`Windows path construction: ${from}`, async () => {
    const renames = []
    await run({ path: path.win32, paths: [from], transformedName: 'foo-bar', rename: async (from, to) => renames.push([from, to]) })
    const expected = path.win32.join(path.win32.dirname(from), 'foo-bar.txt')
    assert.deepStrictEqual(renames, [[from, expected]])
  })
}

test('POSIX root path construction', async () => {
  const renames = []
  await run({ path: path.posix, paths: ['/Foo Bar.txt'], transformedName: 'foo-bar', rename: async (from, to) => renames.push([from, to]) })
  assert.deepStrictEqual(renames, [['/Foo Bar.txt', '/foo-bar.txt']])
})

test('version output does not rename files', async () => {
  const result = await run({ args: { version: true }, rename: () => assert.fail('Unexpected rename') })
  assert.deepStrictEqual(result.logs, [pkg.version])
  assert.deepStrictEqual(result.calls, [])
})

test('missing transform preserves the error', async () => {
  await assert.rejects(run({ args: { unknown: ['fixture/**'] } }), {
    message: 'Please select a transform to apply (kebab, snake, train, pascal, camel, lower, upper)'
  })
})

test('invalid transform preserves the error', async () => {
  await assert.rejects(run({ args: { t: 'invalid', unknown: ['fixture/**'] }, paths: ['File.txt'] }), {
    name: 'TypeError', message: 'transform is not a function'
  })
})

test('no matches produces no output or renames', async () => {
  const result = await run({ rename: () => assert.fail('Unexpected rename') })
  assert.deepStrictEqual(result.logs, [])
  assert.deepStrictEqual(result.calls, [])
})

test('rename errors propagate unchanged', async () => {
  const error = Object.assign(new Error('fixture rename denied'), { code: 'EACCES' })
  await assert.rejects(run({ paths: ['File.txt'], rename: async () => { throw error } }), value => value === error)
})

;(async () => {
  let failed = 0
  for (const { name, run } of tests) {
    try {
      await run()
      console.log(`ok - ${name}`)
    } catch (error) {
      failed++
      console.error(`not ok - ${name}: ${error.message}`)
    }
  }
  console.log(`${tests.length - failed}/${tests.length} tests passed`)
  if (failed) process.exitCode = 1
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
