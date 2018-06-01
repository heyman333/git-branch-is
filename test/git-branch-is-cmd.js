/**
 * @copyright Copyright 2016 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const gitBranchIsCmd = require('../bin/git-branch-is');

const BBPromise = require('bluebird').Promise;
// eslint-disable-next-line no-undef
const PPromise = typeof Promise === 'function' ? Promise : BBPromise;
const assert = require('assert');
const assertMatch = require('../test-lib/assert-match');
const constants = require('../test-lib/constants');
const execFile = require('child_process').execFile;
const path = require('path');

/** Initial command arguments. */
const ARGS = [process.argv[0], 'git-branch-is'];

// Local copy of shared constants
const BRANCH_CURRENT = constants.BRANCH_CURRENT;
const SUBDIR_NAME = constants.SUBDIR_NAME;
const TEST_REPO_PATH = constants.TEST_REPO_PATH;

const BRANCH_CURRENT_RE = new RegExp(`\\b${constants.BRANCH_CURRENT}\\b`);

describe('git-branch-is', () => {
  it('exit code 0 silently for same branch name', (done) => {
    gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit code 1 with warning for different branch name', (done) => {
    gitBranchIsCmd(ARGS.concat('invalid'), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      assertMatch(result.stderr, /\binvalid\b/);
      assertMatch(result.stderr, BRANCH_CURRENT_RE);
      done();
    });
  });

  it('exit code 1 with warning for different case branch name', (done) => {
    const branchUpper = BRANCH_CURRENT.toUpperCase();
    gitBranchIsCmd(ARGS.concat(branchUpper), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      const branchUpperRE = new RegExp(`\\b${branchUpper}\\b`);
      assertMatch(result.stderr, branchUpperRE);
      assertMatch(result.stderr, BRANCH_CURRENT_RE);
      done();
    });
  });

  it('exit code 0 silently for case-insensitive branch name', (done) => {
    const args = ARGS.concat('-i', BRANCH_CURRENT.toUpperCase());
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit 0 silently for matching anchored regex branch name', (done) => {
    const args = ARGS.concat('-r', `^${BRANCH_CURRENT}$`);
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit 0 silently for matching substr regex branch name', (done) => {
    const args = ARGS.concat('-r', BRANCH_CURRENT.slice(1, -1));
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit 0 silently for matching empty regex branch name', (done) => {
    const args = ARGS.concat('-r', '');
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit 0 silently for matching i regex branch name', (done) => {
    const args =
      ARGS.concat('-i', '-r', `^${BRANCH_CURRENT.toUpperCase()}$`);
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit 1 with warning for non-match regex branch name', (done) => {
    gitBranchIsCmd(ARGS.concat('-r', 'invalid'), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      assertMatch(result.stderr, /\binvalid\b/);
      assertMatch(result.stderr, BRANCH_CURRENT_RE);
      done();
    });
  });

  it('exit 1 with warning for no-match case regex branch name', (done) => {
    const branchUpper = BRANCH_CURRENT.toUpperCase();
    gitBranchIsCmd(ARGS.concat('-r', branchUpper), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      const branchUpperRE = new RegExp(`\\b${branchUpper}\\b`);
      assertMatch(result.stderr, branchUpperRE);
      assertMatch(result.stderr, BRANCH_CURRENT_RE);
      done();
    });
  });

  it('exit 2 with warning for invalid regex', (done) => {
    gitBranchIsCmd(ARGS.concat('-r', 'b[ad'), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 2);
      assert(!result.stdout);
      assertMatch(result.stderr, /\bb\[ad\b/);
      done();
    });
  });

  // --quiet does not suppress notification of caller errors
  // If this behavior is desired, consider using repeated -q option.
  it('exit 2 with warning for invalid regex with quiet', (done) => {
    gitBranchIsCmd(ARGS.concat('-q', '-r', 'b[ad'), (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 2);
      assert(!result.stdout);
      assertMatch(result.stderr, /\bb\[ad\b/);
      done();
    });
  });

  it('exit code 1 silently with quiet option', (done) => {
    const args = ARGS.concat('-q', 'invalid');
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 1);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('exit code 0 with message if verbose', (done) => {
    const args = ARGS.concat('-v', BRANCH_CURRENT);
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assertMatch(result.stdout, BRANCH_CURRENT_RE);
      assert(!result.stderr);
      done();
    });
  });

  // Note:  This is one of the few errors that doesn't call process.exit
  it('callback Error for multiple args', (done) => {
    gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT, 'foo'), (err, result) => {
      assert(err instanceof Error);
      assertMatch(err.message, /\bargument/i);
      assertMatch(err.message, /\busage/i);
      done();
    });
  });

  it('can specify an additional git argument', (done) => {
    const args = ARGS.concat(
      '-C',
      SUBDIR_NAME,
      '--git-arg=--git-dir=../.git',
      BRANCH_CURRENT
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify multiple additional git arguments', (done) => {
    const args = ARGS.concat(
      '-C',
      '..',
      '--git-arg=-C',
      `--git-arg=${TEST_REPO_PATH}`,
      BRANCH_CURRENT
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify an additional git arguments separately', (done) => {
    const args = ARGS.concat(
      '--git-arg',
      '-C',
      '--git-arg',
      TEST_REPO_PATH,
      '-C',
      '..',
      BRANCH_CURRENT
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('gitArgs takes precedence over gitDir', (done) => {
    const args = ARGS.concat(
      '--git-arg',
      // Note:  Also tests that Commander interprets this as option argument
      '--git-dir=.git',
      '--git-dir=invalid',
      BRANCH_CURRENT
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  it('can specify git executable and args', (done) => {
    const gitArg = path.join('..', '..', 'test-bin', 'echo-surprise.js');
    const args = ARGS.concat(
      '-C',
      SUBDIR_NAME,
      `--git-arg=${gitArg}`,
      `--git-path=${process.execPath}`,
      'surprise'
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  // Just like git -C and --git-dir
  it('gitDir is relative to cwd', (done) => {
    const args = ARGS.concat(
      '-C',
      SUBDIR_NAME,
      `--git-dir=${path.join('..', '.git')}`,
      BRANCH_CURRENT
    );
    gitBranchIsCmd(args, (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result.code, 0);
      assert(!result.stdout);
      assert(!result.stderr);
      done();
    });
  });

  describe('with global Promise', () => {
    let hadPromise, oldPromise;

    before('ensure global Promise', () => {
      if (global.Promise !== PPromise) {
        hadPromise = hasOwnProperty.call(global, 'Promise');
        oldPromise = global.Promise;
        global.Promise = PPromise;
      }
    });

    after('restore global Promise', () => {
      if (hadPromise === true) {
        global.Promise = oldPromise;
      } else if (hadPromise === false) {
        delete global.Promise;
      }
    });

    it('returns a Promise with the result', () => {
      const promise = gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT));
      assert(promise instanceof global.Promise);
      return promise.then((result) => {
        assert.strictEqual(result.code, 0);
        assert(!result.stdout);
        assert(!result.stderr);
      });
    });

    it('rejects the Promise with an Error', () => {
      const promise = gitBranchIsCmd(ARGS.concat(
        '-C',
        'invalid',
        BRANCH_CURRENT
      ));
      assert(promise instanceof global.Promise);
      return promise.then(
        (result) => { throw new Error('expecting Error'); },
        (err) => { assert(err instanceof Error); }
      );
    });
  });

  describe('without global Promise', () => {
    let hadPromise, oldPromise;

    before('remove global Promise', () => {
      if (global.Promise) {
        hadPromise = hasOwnProperty.call(global, 'Promise');
        oldPromise = global.Promise;
        // Note:  Deleting triggers Mocha's global leak detection.
        // Also wouldn't work if global scope had a prototype chain.
        global.Promise = undefined;
      }
    });

    after('restore global Promise', () => {
      if (oldPromise) {
        if (hadPromise) {
          global.Promise = oldPromise;
        } else {
          delete global.Promise;
        }
      }
    });

    it('throws without a callback', () => {
      assert.throws(
        () => {
          gitBranchIsCmd(ARGS.concat(BRANCH_CURRENT));
        },
        (err) => err instanceof TypeError &&
                /\bcallback\b/.test(err.message)
      );
    });
  });

  it('exit code 0 works when executed', (done) => {
    execFile(
      process.execPath,
      [path.join('..', 'bin', 'git-branch-is.js'), '-v', BRANCH_CURRENT],
      (err, stdout, stderr) => {
        assert.ifError(err);
        assertMatch(stdout, BRANCH_CURRENT_RE);
        assert(!stderr);
        done();
      }
    );
  });

  it('exit code 1 works when executed', (done) => {
    execFile(
      process.execPath,
      [path.join('..', 'bin', 'git-branch-is.js'), 'invalid'],
      (err, stdout, stderr) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, 1);
        assertMatch(stderr, /\binvalid\b/);
        assertMatch(stderr, BRANCH_CURRENT_RE);
        done();
      }
    );
  });

  it('exit code 1 with extra args works when executed', (done) => {
    execFile(
      process.execPath,
      [path.join('..', 'bin', 'git-branch-is.js'), 'invalid', 'extra arg'],
      (err, stdout, stderr) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, 1);
        assert(!stdout);
        assertMatch(stderr, /\bargument/);
        done();
      }
    );
  });
});
