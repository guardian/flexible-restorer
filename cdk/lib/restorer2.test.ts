import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Restorer2 } from "./restorer2";

describe("The Restorer2 stack", () => {
  it.each(["CODE", "PROD"])("matches the snapshot for %s", (stage) => {
    const app = new App();
    const stack = new Restorer2(app, `Restorer2-${stage}`, {
      stack: "flexible",
      stage,
      env: { region: "eu-west-1" },
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
