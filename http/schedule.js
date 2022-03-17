"use strict";

const https = require("https");
const insomnialookup = require("./insomnia-lookup.json");

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v2.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.proxy = async (event) => {
  return subrequest(event.path)
    .then((response) => {
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(response),
      };
    })
    .catch((e) => {
      return {
        statusCode: 500,
        body: e,
      };
    });
};

exports.join = async (event) => {
  return subrequest("/rest/stations/3pbs/guides/fm")
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
      return subrequest("/rest/stations/3pbs/programs").then(function (
        programs
      ) {
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
              newProgram["duration"] =
                program["duration"] == null ? 7200 : program["duration"];
              return newProgram;
            default:
              return program;
          }
        });

        return corrected;
      });
    })
    .catch((e) => {
      return {
        statusCode: 500,
        body: e,
      };
    });
};

function subrequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      host: "airnet.org.au",
      path: path,
      port: 443,
      method: "GET",
    };
    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error("statusCode=" + res.statusCode));
      }
      var body = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      res.on("end", function () {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch (e) {
          reject(e);
        }
        resolve(body);
      });
    });
    req.on("error", (e) => {
      reject(e.message);
    });
    // send the request
    req.end();
  });
}
