import "source-map-support/register";
import { GuRoot } from "@guardian/cdk/lib/constructs/root";
import { Restorer2 } from "../lib/restorer2";

const app = new GuRoot();
new Restorer2(app, "Restorer2-euwest-1-CODE", {
  stack: "flexible",
  stage: "CODE",
  env: { region: "eu-west-1" },
  cloudFormationStackName: "Flexible-Restorer-CODE",
});
new Restorer2(app, "Restorer2-euwest-1-PROD", {
  stack: "flexible",
  stage: "PROD",
  env: { region: "eu-west-1" },
  cloudFormationStackName: "Flexible-Restorer-PROD",
});
