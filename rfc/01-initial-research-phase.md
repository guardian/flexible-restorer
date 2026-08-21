## Setup local testing environment

Aim:
We want to be able to run end to end tests against the restorer app locally. This is part of a broader project to migrate the frontend of this application to React. We believe that having comprehensive test coverage will allow us to migrate with confidence, and that we have not introduced any bugs during the migration.

The restorer app is mostly read only, it should be easy to run some UI tests to validate existing functionality.

The main point of ingress is s3, so we are happy to run s3 locally with some fixture snapshots to support our tests

The single egress is a POST to composer api, so we are happy to check that contract, rather than running the whole of composer locally.

We considered running the whole of composer etc in local containers, but this felt like overkill because of there is only 1 egress point.

# Running stack locally

We have considered using [TestContainers](https://testcontainers.com/) or [Docker compose](https://docs.docker.com/compose/) for running tests against the application in CI and locally.

We think that `TestContainers` has some scalability advantages over spinning up `docker compose` locally when testing.
The advantages are:

- We get to control the stack setup and teardown directly from the test runner, rather than having to run separate commands to interface with the docker instances directly.
- This extra control allows for different fixtures to be loaded more easily, and to also be able to run multiple tests (and therefore underlying test stacks) in parallel, which gives us horizontal scalability for running tess.
- TestContainers also have prior art in coverdrop where this is the approach to running end to end tests in CI and locally

We discussed using local stack vs minio for s3 local support, and landed on minio as this was also used on the coverdrop project.

# Building the test infrastructure

We will build 2 docker containers, 1 for the restore app and a second to host minio to provide an s3 bucket interface

For the restore app, the docker container needs all the dependencies to run the scala backend, and to have built the angular frontend

The minio container just needs to have minio latest version installed

These will then be spun up from a node js script that uses the TestContainer library to start the stack.

We will get a single snapshot loaded into the stack which will allow us to start the restorer application and visit a content url.
