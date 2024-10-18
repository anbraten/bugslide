# Bugslide

Simple error tracker that can be used with Sentry-compatible SDKs.
It is designed to be self-hosted and easy to use.

## Setup client (browser)

1. Install dependencies:

```bash
$ npm install --save @sentry/browser
```

2. Setup Sentry client:

```javascript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'http://can-be-ignored@localhost:3000/<project-id>',
  environment: 'development',
  release: 'commit:abcdefg12345',
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({
      levels: ['error'],
    }),
  ],

  logErrors: true,
});

Sentry.captureMessage('Hello, world!');
```

## TODO

- [ ] Fix events counter race-condition when inserting multiple events at once
- [ ] Add support for multiple projects
  - [ ] Add new project
  - [ ] Delete project
- [ ] Add authentication
  - [ ] Login
  - [ ] Logout
  - [ ] Register
  - [ ] Assign user to project
  - [ ] Only return projects that user is assigned to
- [ ] Source maps
  - [ ] Upload source maps
  - [ ] Show stack trace with source maps
- [ ] Allow to resolve issues
  - [ ] Add button to resolve / unresolve issue
  - [ ] Show resolved issues in a separate tab
- [ ] Link releases to forge
- [ ] Allow filtering by
  - [ ] Environment
- [ ] Alert when new issue is created
