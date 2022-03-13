// let insomnialookup = require("insomnia-lookup.json");

let insomnialookup = {
  insomnia_sunday: ["subterranean-chill", "yellowbrickroad"],
  insomnia_monday: ["got-the-blues", "transfigurations"],
  insomnia_tuesday: ["the-modernist", "shaggin-the-night-away"],
  insomnia_wednesday: ["tnt", "lca"],
  insomnia_thursday: ["audiovitamins", "tyrannocoreus"],
  insomnia_friday: ["irvine-jump", "new-noise"],
  insomnia_saturday: ["new-noise"],
};

function hello(r) {
  r.return(200, "Hello world\n");
}

async function join(r) {
  r.subrequest("/rest/stations/3pbs/guides/fm")
    .then((reply) => JSON.parse(reply.responseBody))
    .then((response) => {
      if (!response) {
        throw new Error("Schedule is not available");
      }
      // Duplicate weeks appending 7 to second week:
      return response.concat(
        response.map(function (program) {
          let update = Object.assign({}, program);
          update["day"] = String(Number(program["day"]) + 7);
          update["onairnow"] = false;
          return update;
        })
      );
    })
    .then((schedule) => {
      r.subrequest("/rest/stations/3pbs/programs")
        .then((reply) => JSON.parse(reply.responseBody))
        .then(function (programs) {
          // Map insomnia slugs with programs from lookup:
          let corrected = schedule.map(function (program) {
            switch (program.slug) {
              case "insomnia_monday":
              case "insomnia_tuesday":
              case "insomnia_wednesday":
              case "insomnia_thursday":
              case "insomnia_friday":
              case "insomnia_sunday":
                var newProgram = programs.filter(
                  (prog) =>
                    prog.slug ==
                    insomnialookup[program.slug][
                      Number(program["day"]) < 7 ? 0 : 1
                    ]
                )[0];
                newProgram["day"] = program["day"];
                newProgram["start"] = program["start"];
                newProgram["duration"] = program["duration"] ?? 7200;
                return newProgram;
              default:
                return program;
            }
          });

          r.return(200, JSON.stringify(corrected));
        });
    })
    .catch((e) => r.return(500, e));
}

export default { join, hello };
