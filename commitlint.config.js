/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'trailer-exists': [0],
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 72],
  },
};
