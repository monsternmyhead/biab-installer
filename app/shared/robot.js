/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const _ = require('lodash');

/**
 * @summary Check whether we should emit parseable output
 * @function
 * @public
 *
 * @param {Object} environment - environment
 * @returns {Boolean} whether we should emit parseable output
 *
 * @example
 * if (robot.isEnabled(process.env)) {
 *   console.log('We should emit parseable output');
 * }
 */
exports.isEnabled = (environment) => {
  const value = _.get(environment, 'ETCHER_CLI_ROBOT', false);
  return Boolean(value === 'false' ? false : value);
};

/**
 * @summary Build a machine-parseable message
 * @function
 * @private
 *
 * @param {String} title - message title
 * @param {Object} [data] - message data
 * @returns {String} parseable message
 *
 * @example
 * const message = robot.buildMessage('progress', {
 *   percentage: 50
 * });
 *
 * console.log(message);
 * > '{"command":"progress","data":{"percentage":50}}'
 */
exports.buildMessage = (title, data = {}) => {
  if (!_.isPlainObject(data)) {
    throw new Error(`Invalid data: ${data}`);
  }

  return JSON.stringify({
    command: title,
    data: data
  });
};

/**
 * @summary Parse a machine-parseable message
 * @function
 * @public
 *
 * @param {String} string - message string
 * @returns {Object} parsed message
 *
 * @example
 * const result = robot.parseMessage('{"command":"progress","data":{"foo":50}}');
 * console.log(result);
 * > {
 * >   command: 'progress',
 * >   data: {
 * >     foo: 50
 * >   }
 * > }
 */
exports.parseMessage = (string) => {
  let output;

  try {
    output = JSON.parse(string);
  } catch (error) {
    error.message = 'Invalid message: ' + string;
    error.description = `${string}, ${error.message}`;
    throw error;
  }

  if (!output.command || !output.data) {
    const error = new Error('Invalid message: ' + string);
    error.description = `No command or data: ${string}`;
    throw error;
  }

  return output;
};

/**
 * @summary Build a machine-parseable error message
 * @function
 * @private
 *
 * @param {(String|Error)} error - error
 * @returns {String} parseable error message
 *
 * @example
 * const error = new Error('foo');
 * const errorMessage = robot.buildErrorMessage(error);
 *
 * console.log(error.command);
 * > 'error'
 *
 * console.log(error.data.message);
 * > 'foo'
 *
 * error.data.stacktrace === error.stack;
 * > true
 */
exports.buildErrorMessage = (error) => {
  if (_.isString(error)) {
    error = new Error(error);
  }

  return exports.buildMessage('error', {
    message: error.message,
    description: error.description,
    stacktrace: error.stack,
    code: error.code
  });
};

/**
 * @summary Recompose an error message
 * @function
 * @public
 *
 * @param {String} message - error message
 * @returns {Error} error object
 *
 * @example
 * const message = robot.buildErrorMessage(new Error('foo'));
 * const error = robot.recomposeErrorMessage(robot.parseMessage(message));
 *
 * error instanceof Error;
 * > true
 *
 * console.log(error.message);
 * > 'foo'
 */
exports.recomposeErrorMessage = (message) => {
  const error = new Error(message.data.message);
  _.assign(error, _.omit(message.data, 'stacktrace'));
  error.stack = message.data.stacktrace;
  return error;
};

/**
 * @summary Get message command
 * @function
 * @public
 *
 * @param {Object} message - message
 * @returns {String} command
 *
 * @example
 * const command = robot.getCommand({
 *   command: 'foo',
 *   data: {}
 * });
 *
 * console.log(command);
 * > 'foo'
 */
exports.getCommand = (message) => {
  return _.get(message, 'command');
};

/**
 * @summary Get message data
 * @function
 * @public
 *
 * @param {Object} message - message
 * @returns {Object} data
 *
 * @example
 * const data = robot.getData({
 *   command: 'foo',
 *   data: {
 *     foo: 1
 *   }
 * });
 *
 * console.log(data);
 * > { foo: 1 }
 */
exports.getData = (message) => {
  return _.get(message, 'data', {});
};

/**
 * @summary Print an error in a machine-friendly way
 * @function
 * @public
 *
 * @param {(Error|String)} error - error
 *
 * @example
 * robot.printError(new Error('This is an error'));
 */
exports.printError = (error) => {
  console.error(exports.buildErrorMessage(error));
};

/**
 * @summary Print a message in a machine-friendly way
 * @function
 * @public
 *
 * @param {String} message - message
 * @param {Object} [data] - data
 *
 * @example
 * robot.printMessage('progress', { percentage: 50 });
 */
exports.printMessage = (message, data) => {
  console.log(exports.buildMessage(message, data));
};
