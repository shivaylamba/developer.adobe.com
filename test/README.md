# Running Tests

We have several kinds of tests available in this project, like unit tests and
end to end tests. A high level overview of these is available in our [testing
plan document](../docs/TESTING-CD-CD.md). This document focuses on how, as a
developer, you run these tests.

## Linter

Make sure you write your JavaScript the way we want you to!

    npm run lint

## Unit Tests

    npm run test:unit

## Link Checker

    node --max-old-space-size=8192 check_links.js https://www.adobe.io

The link checker is a RAM hog, so make sure you run it with extra memory (as
with the flag above).

The first argument provided to the script is the "base" site to crawl. The link
checker will crawl that site, and for any links on the same domain, will recursively
crawl through those links as well. It will verify that external links do not 404.
It also has custom code to try to catch Kirby's "soft" 404s.

At the time of writing this, the above takes about 5 minutes to execute on a
decent network and crawls between 3,000 to 4,000 links.

Note that the link checker uses HEAD requests to verify links and this sometimes
returns false positives. As such, consider this system an "early warning" system
rather than a pass/fail. Manual review of link checker results is a must!

## End to End Tests

Here's where it gets fun! We support a variety of ways to run the end to end
(also known as functional, or UI, or clicky) tests. We support:

- running tests against the helix-powered version of the site, or the
    AEM-powered version of the site
- running tests against a local instance of helix, or a remotely-deployed,
    publicly-accessible instance
- running the tests from a browser that runs locally on your laptop, or running
    the tests from the remote testing service [Sauce
    Labs](http://saucelabs.com)
- running a local instance of helix on CircleCI and "bridging" (or tunneling)
    the CircleCI and Sauce Labs environments using a tool called [Sauce
    Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy). This
    is sweet because you can have multiple Sauce VMs automate multiple browsers
    at once, and hit a server accessible only on your local machine on
    `localhost`. [We use this technique in our CI](../.circleci/config.yml#L15-L24)

### Requirements

Make sure you set `SAUCELABS_USER` and `SAUCELABS_KEY` environment variables
before running the tests. You can get these credentials from @filmaj.

### Running End to End Tests

All of the above combinations can be overwhelming. How do you run this stuff, then?
We've encapsulated the test tasks in a few `npm run` scripts. Try these out:

- Run a local headless Chrome browser instance against a locally-running
    instance of the helix site: `npm run test:e2e-helix-local`
    - **NOTE**: you will need Chrome installed on your machine for this.
- Run a local headless Chrome browser instance against the staging URL for the
    helix site: `npm run test:e2e-helix-local -- --baseUrl
    https://adobedevsite.helix-demo.xyz`
    - **NOTE**: you will need Chrome installed on your machine for this.
- Run a Sauce Labs browser instance against the staging URL for the helix site
    (which is https://adobedevsite.helix-demo.xyz): `npm run test:e2e-helix-sauce`
- Run a local headless Chrome browser instance against https://adobe.io: `npm
    run test:e2e-aem-local`
- Run a Sauce Labs browser instance against https://adobe.io: `npm run
    test:e2e-aem-sauce`

## All Together Now

**Note** that this runs linting, unit tests, and end-to-end tests using a local Chrome
instance against a local running helix instance:

    npm test
