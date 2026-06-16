# Local panda access token issued when app starts

## Problem

Currently when running the restorer app locally, you need a panda access token set in a cookie to allow you to access certain pages.

When running the app locally, this normally happens by the developer going through an oauth flow with their google guardian user, and a real access token is issued to the https://restorer.local.dev-gutools.co.uk/ domain, and the application accepts this by validating against the google oauth servers.

If we want to run automated tests against the local app, we need a way to do this authentication without a developer having to provide their credentials

The way we mint the `gutoolsAuth-assym` access token is in once we have authenticated the user via google oauth, the application uses the pan-domain-auth library, this library has access to the s3 bucket which contains the public and private keypair(s) which are used to mint and validate the access tokens.

## Components

panda s3 bucket - the bucket the panda public / private keypair for creating access tokens is store

panda library - the panda code that is integrated into most ed tools web applications, including restorer

google oauth servers - the oauth servers that all applications use to authenticate the local developers

panda cookie scoped to `.local.dev-gutools.co.uk` - the cookie that contains the panda `gutoolsAuth-assym` access token

`gutoolsAuth-assym` - the access token created by the panda library

## Proposals

### 1. Local dev minting service

#### Overview

Run a separate local panda scala application that has endpoints to create tokens, as well as set cookies on the local domain.

When the local panda application is started, it requires an s3 bucket path to be provided.

When start our test runner and spin up a local stack for testing, we will create an ephemeral public / private key pair in the local panda s3 bucket `local-panda-bucket`.

The local panda application will check the `local-panda-bucket` when the app starts, and load the relevant public / private key pair.

The playwright test runner will start the application stack using testcontainers, and will pass in the `local-panda-bucket` as the panda s3 domain. This is mean that the restorer app will get its panda keypair from the `local-panda-bucket` rather than the shared dev bucket. This means that the tokens issue are only going to be valid in this single test run, and not against any other stack on `.local.dev-gutools.co.uk`

The playwright test runner will start the browser, visit the local panda application `/token` endpoint and a valid local panda cookie will be set.

### 2. Js dev cookie creating in playwright

#### Overview

Playwright test runner will have access to the the shared panda secret, so creates a new cookie when the test are run. As this cookie has been created from the shared secret, this will be valid locally.

When the local panda application is started, it requires an s3 bucket path to be provided.

When start our test runner and spin up a local stack for testing, we will create an ephemeral public / private key pair in the local panda s3 bucket `local-panda-bucket`.

The local panda application will check the `local-panda-bucket` when the app starts, and load the relevant public / private key pair.

The playwright test runner will start the application stack using testcontainers, and will pass in the `local-panda-bucket` as the panda s3 domain. This is mean that the restorer app will get its panda keypair from the `local-panda-bucket` rather than the shared dev bucket. This means that the tokens issue are only going to be valid in this single test run, and not against any other stack on `.local.dev-gutools.co.uk`

The playwright test runner will start the browser and send a cookie set header to the browser using values signed with the shared secret and a valid local panda cookie will be set.
