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
  - [x] Login / Register
  - [x] Logout
  - [ ] Assign user to project
  - [ ] Only return projects that user is assigned to
- [ ] Source maps
  - [ ] Upload source maps
  - [ ] Show stack trace with source maps
- [ ] Allow to resolve issues
  - [ ] Add button to resolve / unresolve issue
- [ ] Allow to delete issues
- [ ] Releases
  - [ ] Automatically create release when first event is received
  - [ ] Link to open release in forge
  - [ ] Upload source maps
- [ ] Environment
  - [ ] Automatically create environment when first event is received
- [ ] Allow filtering by
  - [ ] Environment
  - [ ] Release
  - [ ] Status (resolved / unresolved / ignored)
- [ ] rate limiting & quotas
  - [ ] event submission x / minute
  - [ ] delete resolved issues after x days
  - [ ] delete error event data after x days
  - [ ] delete oldest event if limit x is reached
- [ ] Alert when new issue is created
- [ ] Add release to first seen / last seen
