import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Restorer2 } from "./restorer2";

describe("The Restorer2 stack", () => {
  it("matches the snapshot", () => {
    const app = new App();
    const stack = new Restorer2(app, "Restorer2", { stack: "flexible", stage: "TEST" });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
