{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs { };
  guardianNix = builtins.fetchGit {
    url = "git@github.com:guardian/guardian-nix.git";
    ref = "refs/tags/v1";
  };
  guardianDev = import "${guardianNix.outPath}/guardian-dev.nix" pkgs;

  sbtWithJava11 = pkgs.sbt.override { jre = pkgs.corretto11; };

  npmWatch = pkgs.writeShellApplication {
    name = "npm-watch";
    runtimeInputs = [ pkgs.nodejs_18 ]; # should be node 12
    text = ''
      export NODE_OPTIONS=--openssl-legacy-provider
      npm install
      npm run watch
    '';
  };

  sbtRun = pkgs.writeShellApplication {
    name = "sbt-restart";
    runtimeInputs = [ sbtWithJava11 ];
    text = ''
      sbt run
    '';
  };

in guardianDev.devEnv {
  name = "flexible-restorer";
  commands = [ npmWatch sbtRun ];
  extraInputs = [ pkgs.metals sbtWithJava11 ];
}
